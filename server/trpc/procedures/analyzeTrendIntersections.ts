import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const analyzeTrendIntersections = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      trendIds: z.array(z.number()).optional(),
      autoSelect: z.boolean().default(true),
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

    let trends;

    if (input.trendIds && input.trendIds.length > 0) {
      // Use specified trends
      trends = await db.trend.findMany({
        where: {
          id: { in: input.trendIds },
        },
        include: {
          market: true,
        },
      });

      // Verify user has access to all trends
      const hasAccess = trends.every((t) => t.market.userId === user.id);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to all specified trends",
        });
      }
    } else if (input.marketId) {
      // Auto-select trends from market
      const market = await db.market.findUnique({
        where: { id: input.marketId },
        include: {
          trends: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!market || market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this market",
        });
      }

      trends = market.trends;
    } else {
      // Auto-select from user's recent trends
      const userMarkets = await db.market.findMany({
        where: { userId: user.id },
        include: {
          trends: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      trends = userMarkets.flatMap((m) => m.trends);
    }

    if (trends.length < 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least 2 trends are required for intersection analysis",
      });
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const { object } = await generateObject({
        model,
        schema: z.object({
          intersections: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              trendIds: z.array(z.number()),
              intersectionType: z.enum(["convergence", "collision", "synergy", "disruption"]),
              strength: z.number().min(0).max(1),
              reasoning: z.string(),
              potentialImpact: z.string(),
              marketOpportunity: z.string(),
              isUnexpected: z.boolean(),
            }),
          ),
        }),
        prompt: `You are a trend analyst specializing in identifying non-obvious connections and intersections between market trends.

Analyze these trends and identify meaningful intersections:

${trends.map((t, idx) => `Trend ${idx + 1} (ID: ${t.id}):
Title: ${t.title}
Type: ${t.trendType || "general"}
Data: ${t.trendData}
Sentiment: ${t.sentimentScore || "N/A"}
`).join("\n")}

Identify intersections where:
- CONVERGENCE: Multiple trends moving toward the same outcome
- COLLISION: Trends creating tension or forcing choice
- SYNERGY: Trends that amplify each other's impact
- DISRUPTION: Trend combinations that could disrupt existing markets

For each intersection:
1. Explain how the trends relate to each other
2. Assess the strength of the connection (0-1)
3. Describe potential market impact
4. Suggest specific market opportunities
5. Flag if this is an UNEXPECTED or NON-OBVIOUS intersection

Focus on "white space" opportunities - intersections that create entirely new market categories rather than incremental improvements.`,
      });

      // Create trend intersections in database
      const createdIntersections = await Promise.all(
        object.intersections.map((intersection) =>
          db.trendIntersection.create({
            data: {
              name: intersection.name,
              description: intersection.description,
              trendIds: JSON.stringify(intersection.trendIds),
              intersectionType: intersection.intersectionType,
              strength: intersection.strength,
              reasoning: intersection.reasoning,
              potentialImpact: intersection.potentialImpact,
              marketOpportunity: intersection.marketOpportunity,
              isUnexpected: intersection.isUnexpected,
            },
          }),
        ),
      );

      return {
        intersections: createdIntersections,
        count: createdIntersections.length,
      };
    } catch (error) {
      console.error("Failed to analyze trend intersections:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to analyze trends. Please try again.",
      });
    }
  });
