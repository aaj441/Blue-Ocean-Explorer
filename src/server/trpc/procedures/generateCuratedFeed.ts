import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateCuratedFeed = baseProcedure
  .input(
    z.object({
      token: z.string(),
      feedType: z.enum(["weekly_digest", "investor_insights", "trend_alerts", "blue_ocean_opportunities"]),
      targetAudience: z.enum(["investors", "strategists", "executives", "all"]).optional(),
      industries: z.array(z.string()).optional(),
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

    try {
      // Gather data for curation
      const recentOpportunities = await db.opportunity.findMany({
        where: {
          segment: {
            market: {
              userId: user.id,
            },
          },
          status: "approved",
        },
        include: {
          segment: {
            include: {
              market: true,
            },
          },
          insight: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      const trendIntersections = await db.trendIntersection.findMany({
        where: {
          isUnexpected: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      const valueMigrations = await db.valueMigration.findMany({
        orderBy: {
          confidence: "desc",
        },
        take: 10,
      });

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const feedTypeInstructions = {
        weekly_digest: "Curate the top 5-7 most important insights, opportunities, and trends from the past week. Focus on actionable intelligence.",
        investor_insights: "Curate investment-worthy opportunities with strong ROI potential and clear market opportunities. Focus on financial viability.",
        trend_alerts: "Curate emerging trends, unexpected intersections, and early signals of market shifts. Focus on forward-looking intelligence.",
        blue_ocean_opportunities: "Curate true blue ocean opportunities - uncontested market spaces with high value innovation potential. Focus on market creation.",
      };

      const { object } = await generateObject({
        model,
        schema: z.object({
          title: z.string(),
          summary: z.string(),
          items: z.array(
            z.object({
              type: z.enum(["opportunity", "trend", "insight", "migration", "intersection"]),
              title: z.string(),
              description: z.string(),
              whyItMatters: z.string(),
              actionableSteps: z.array(z.string()),
              relevanceScore: z.number().min(0).max(100),
              urgency: z.enum(["low", "medium", "high"]),
              sourceData: z.string().describe("Reference to original data"),
            }),
          ),
          keyThemes: z.array(z.string()),
          recommendations: z.array(z.string()),
          qualityScore: z.number().min(0).max(100),
        }),
        prompt: `You are an expert curator of strategic business intelligence, specializing in Blue Ocean Strategy and market innovation.

CURATION TASK: ${input.feedType}
TARGET AUDIENCE: ${input.targetAudience || "all"}
${input.industries && input.industries.length > 0 ? `FOCUS INDUSTRIES: ${input.industries.join(", ")}` : ""}

${feedTypeInstructions[input.feedType]}

AVAILABLE DATA:

Recent Opportunities (${recentOpportunities.length}):
${recentOpportunities.slice(0, 10).map((opp) => `
- ${opp.title} (${opp.segment.market.sector})
  Score: ${opp.score}, Risk: ${opp.risk}
  ${opp.insight?.weirdnessScore ? `Weirdness: ${opp.insight.weirdnessScore}` : ""}
`).join("")}

Trend Intersections (${trendIntersections.length}):
${trendIntersections.slice(0, 5).map((ti) => `
- ${ti.name} (${ti.intersectionType})
  Strength: ${ti.strength}, Unexpected: ${ti.isUnexpected}
  ${ti.marketOpportunity}
`).join("")}

Value Migrations (${valueMigrations.length}):
${valueMigrations.slice(0, 5).map((vm) => `
- ${vm.name}
  From: ${vm.fromIndustry} → To: ${vm.toIndustry}
  Timeline: ${vm.timeline}, Confidence: ${vm.confidence}
`).join("")}

Curate 5-10 high-quality items. Prioritize:
1. **Novelty**: Non-obvious insights and opportunities
2. **Actionability**: Clear next steps
3. **Impact**: High potential value creation
4. **Timeliness**: Relevant to current market conditions
5. **Blue Ocean Fit**: Focus on uncontested market spaces

Assign relevance scores (0-100) and urgency levels. Provide actionable recommendations.`,
      });

      // Save curated feed
      const feed = await db.curatedFeed.create({
        data: {
          title: object.title,
          description: object.summary,
          feedType: input.feedType,
          content: JSON.stringify(object.items),
          targetAudience: input.targetAudience || "all",
          tags: JSON.stringify(object.keyThemes),
          qualityScore: object.qualityScore,
        },
      });

      return {
        feed,
        items: object.items,
        recommendations: object.recommendations,
        qualityScore: object.qualityScore,
      };
    } catch (error) {
      console.error("Failed to generate curated feed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate curated feed. Please try again.",
      });
    }
  });
