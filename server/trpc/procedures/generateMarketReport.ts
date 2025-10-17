import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateMarketReport = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      opportunityId: z.number().optional(),
      reportType: z.enum(["market_analysis", "trend_report", "opportunity_brief", "competitive_landscape", "value_migration"]),
      depth: z.enum(["executive_summary", "standard", "comprehensive"]).default("standard"),
      includeRecommendations: z.boolean().default(true),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    let contextData: any = {};
    let reportTitle = "";

    if (input.marketId) {
      const market = await db.market.findUnique({
        where: { id: input.marketId },
        include: {
          segments: true,
          competitors: true,
          trends: true,
        },
      });

      if (!market || market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this market",
        });
      }

      const opportunities = await db.opportunity.findMany({
        where: {
          segment: {
            marketId: input.marketId,
          },
        },
        include: {
          segment: true,
          insight: true,
        },
      });

      contextData = {
        market: market.name,
        sector: market.sector,
        description: market.description,
        segments: market.segments,
        competitors: market.competitors,
        trends: market.trends,
        opportunities,
      };

      reportTitle = `${input.reportType.replace(/_/g, " ")} - ${market.name}`;
    } else if (input.opportunityId) {
      const opportunity = await db.opportunity.findUnique({
        where: { id: input.opportunityId },
        include: {
          segment: {
            include: {
              market: {
                include: {
                  competitors: true,
                  trends: true,
                },
              },
            },
          },
          insight: true,
          scenarios: true,
        },
      });

      if (!opportunity || opportunity.segment.market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this opportunity",
        });
      }

      contextData = {
        opportunity: opportunity.title,
        description: opportunity.description,
        score: opportunity.score,
        risk: opportunity.risk,
        market: opportunity.segment.market.name,
        sector: opportunity.segment.market.sector,
        segment: opportunity.segment,
        competitors: opportunity.segment.market.competitors,
        trends: opportunity.segment.market.trends,
        scenarios: opportunity.scenarios,
        insight: opportunity.insight,
      };

      reportTitle = `${input.reportType.replace(/_/g, " ")} - ${opportunity.title}`;
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either marketId or opportunityId is required",
      });
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const depthInstructions = {
        executive_summary: "2-3 pages, high-level insights only, focus on key takeaways and recommendations",
        standard: "5-10 pages, balanced depth with analysis and data, suitable for strategy teams",
        comprehensive: "15-20 pages, deep analysis with detailed data, methodologies, and extensive recommendations",
      };

      const { object } = await generateObject({
        model,
        schema: z.object({
          title: z.string(),
          executiveSummary: z.string(),
          sections: z.array(
            z.object({
              heading: z.string(),
              content: z.string(),
              keyInsights: z.array(z.string()),
              dataPoints: z.array(z.object({
                metric: z.string(),
                value: z.string(),
                context: z.string(),
              })).optional(),
            }),
          ),
          keyFindings: z.array(z.string()),
          recommendations: z.array(z.object({
            title: z.string(),
            description: z.string(),
            priority: z.enum(["high", "medium", "low"]),
            timeframe: z.string(),
            expectedImpact: z.string(),
          })),
          methodology: z.string(),
          dataQuality: z.enum(["high", "medium", "low"]),
          confidenceLevel: z.number().min(0).max(100),
        }),
        prompt: `You are a strategic market analyst creating a professional ${input.reportType.replace(/_/g, " ")}.

REPORT DEPTH: ${input.depth}
${depthInstructions[input.depth]}

CONTEXT:
${JSON.stringify(contextData, null, 2)}

Create a comprehensive, data-driven report with the following structure:

1. **Executive Summary**: Concise overview of key findings
2. **Market Overview**: Current state, size, growth, dynamics
3. **Competitive Landscape**: Key players, positioning, strengths/weaknesses
4. **Trend Analysis**: Emerging trends, shifts, disruptions
5. **Opportunity Assessment**: Blue ocean opportunities, uncontested spaces
6. **Risk Analysis**: Key risks, challenges, mitigation strategies
7. **Strategic Recommendations**: Actionable next steps

Focus on Blue Ocean Strategy principles:
- Identify uncontested market spaces
- Value innovation opportunities
- Non-customers and underserved segments
- Industry assumptions to challenge
- New market creation potential

Use data from the context to support insights. Be specific and actionable. Assign priority levels to recommendations.`,
      });

      // Save report
      const report = await db.report.create({
        data: {
          userId: user.id,
          marketId: input.marketId,
          opportunityId: input.opportunityId,
          title: reportTitle,
          content: JSON.stringify(object),
          reportType: input.reportType,
          format: "markdown",
          aiGenerated: true,
        },
      });

      return {
        report,
        preview: {
          title: object.title,
          executiveSummary: object.executiveSummary,
          keyFindings: object.keyFindings,
          recommendations: object.recommendations,
        },
      };
    } catch (error) {
      console.error("Failed to generate market report:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate report. Please try again.",
      });
    }
  });
