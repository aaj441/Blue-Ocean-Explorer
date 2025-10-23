import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateCrossIndustryScenarios = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      goals: z.string().min(10, "Please describe your goals in more detail"),
      targetIndustries: z.array(z.string()).optional(),
      count: z.number().min(1).max(5).default(3),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify opportunity exists and user has access
    const opportunity = await db.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        segment: {
          include: {
            market: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Opportunity not found",
      });
    }

    if (opportunity.segment.market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this opportunity",
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      // Generate cross-industry scenarios
      const { object } = await generateObject({
        model,
        schema: z.object({
          scenarios: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              sourceIndustries: z.array(z.string()),
              analogies: z.array(
                z.object({
                  sourceIndustry: z.string(),
                  pattern: z.string(),
                  application: z.string(),
                }),
              ),
              lateralInsights: z.object({
                keyInsight: z.string(),
                whyItWorks: z.string(),
                implementationApproach: z.string(),
              }),
              projectedRevenue: z.number(),
              projectedMarketShare: z.number(),
              projectedROI: z.number(),
              riskAssessment: z.string(),
              keyAssumptions: z.array(z.string()),
            }),
          ),
        }),
        prompt: `You are a Blue Ocean Strategy expert specializing in cross-industry innovation and value innovation.

Analyze this opportunity and generate ${input.count} cross-industry scenarios that apply patterns and insights from UNRELATED industries:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Current Industry: ${opportunity.segment.market.sector}
Market: ${opportunity.segment.market.name}

User Goals: ${input.goals}

${input.targetIndustries && input.targetIndustries.length > 0 ? `Consider these industries: ${input.targetIndustries.join(", ")}` : ""}

For each scenario:
1. Identify 2-3 source industries that are DIFFERENT from the current industry
2. Find successful patterns, business models, or strategies from those industries
3. Create analogies showing how to apply those patterns to this opportunity
4. Provide lateral insights that wouldn't be obvious from within the current industry
5. Generate realistic financial projections
6. Assess risks specific to cross-industry application

Focus on VALUE INNOVATION - creating new market space rather than competing in existing markets. Think about:
- What factors can be eliminated that the industry takes for granted?
- What can be reduced well below industry standards?
- What can be raised well above industry standards?
- What can be created that the industry has never offered?

Make scenarios concrete and actionable, not just theoretical.`,
      });

      // Create scenarios in database
      const createdScenarios = await Promise.all(
        object.scenarios.map((scenario) =>
          db.scenario.create({
            data: {
              opportunityId: input.opportunityId,
              name: scenario.name,
              description: scenario.description,
              projectedRevenue: scenario.projectedRevenue,
              projectedMarketShare: scenario.projectedMarketShare,
              projectedROI: scenario.projectedROI,
              riskAssessment: scenario.riskAssessment,
              keyAssumptions: JSON.stringify(scenario.keyAssumptions),
              isCrossIndustry: true,
              sourceIndustries: JSON.stringify(scenario.sourceIndustries),
              analogies: JSON.stringify(scenario.analogies),
              lateralInsights: JSON.stringify(scenario.lateralInsights),
            },
          }),
        ),
      );

      return {
        scenarios: createdScenarios,
        count: createdScenarios.length,
      };
    } catch (error) {
      console.error("Failed to generate cross-industry scenarios:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate scenarios. Please try again.",
      });
    }
  });
