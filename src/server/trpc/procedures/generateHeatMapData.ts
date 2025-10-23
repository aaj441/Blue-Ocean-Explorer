import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateHeatMapData = baseProcedure
  .input(
    z.object({
      token: z.string(),
      viewType: z.enum(["industry", "geographic", "opportunity_type"]).default("industry"),
      filterSector: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Fetch user's markets and opportunities
    const markets = await db.market.findMany({
      where: { userId: user.id },
      include: {
        segments: {
          include: {
            opportunities: {
              include: {
                insight: true,
              },
            },
          },
        },
        competitors: true,
      },
    });

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

      // Aggregate data for AI analysis
      const marketSummary = markets.map((m) => ({
        name: m.name,
        sector: m.sector,
        competitorCount: m.competitors.length,
        opportunityCount: m.segments.reduce((sum, s) => sum + s.opportunities.length, 0),
        avgOpportunityScore: m.segments.reduce((sum, s) => {
          const scores = s.opportunities.map((o) => o.score);
          return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0) / Math.max(m.segments.length, 1),
      }));

      const { object } = await generateObject({
        model,
        schema: z.object({
          heatMapRegions: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              competitionDensity: z.enum(["low", "medium", "high", "saturated"]),
              opportunityPotential: z.enum(["low", "medium", "high", "exceptional"]),
              blueOceanScore: z.number().min(0).max(100),
              description: z.string(),
              keyInsights: z.array(z.string()),
              recommendedActions: z.array(z.string()),
            }),
          ),
          overallInsights: z.array(z.string()),
          blueOceanAreas: z.array(z.object({
            name: z.string(),
            reason: z.string(),
            potential: z.number().min(0).max(100),
          })),
          redOceanAreas: z.array(z.object({
            name: z.string(),
            reason: z.string(),
            saturationLevel: z.number().min(0).max(100),
          })),
        }),
        prompt: `Analyze competitive density and opportunity potential across markets to create a heat map visualization.

VIEW TYPE: ${input.viewType}

MARKETS DATA:
${JSON.stringify(marketSummary, null, 2)}

Create a heat map analysis that identifies:

1. **Competition Density**: Where are competitors concentrated?
   - LOW: Few competitors, open space
   - MEDIUM: Moderate competition
   - HIGH: Many competitors, crowded
   - SATURATED: Overcrowded, red ocean

2. **Opportunity Potential**: Where are the best opportunities?
   - LOW: Limited potential
   - MEDIUM: Decent potential
   - HIGH: Strong potential
   - EXCEPTIONAL: Blue ocean potential

3. **Blue Ocean Score** (0-100): Combined measure of low competition + high opportunity

Identify:
- Blue Ocean Areas: Low competition + High opportunity
- Red Ocean Areas: High competition + Limited differentiation

Provide actionable insights for where to focus strategic efforts.`,
      });

      return {
        heatMap: object,
        viewType: input.viewType,
        dataPoints: marketSummary.length,
      };
    } catch (error) {
      console.error("Failed to generate heat map data:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate heat map data. Please try again.",
      });
    }
  });
