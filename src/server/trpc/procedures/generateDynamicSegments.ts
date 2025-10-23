import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateDynamicSegments = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      segmentationType: z.enum(["behavioral", "psychographic", "jobs_to_be_done", "all"]).default("all"),
      count: z.number().min(1).max(10).default(5),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const market = await db.market.findUnique({
      where: { id: input.marketId },
      include: {
        segments: true,
        competitors: true,
        trends: true,
      },
    });

    if (!market) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Market not found",
      });
    }

    if (market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this market",
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

      const { object } = await generateObject({
        model,
        schema: z.object({
          segments: z.array(
            z.object({
              name: z.string(),
              segmentType: z.enum(["behavioral", "psychographic", "jobs_to_be_done"]),
              characteristics: z.string(),
              behavioralTraits: z.array(z.string()).optional(),
              psychographics: z
                .object({
                  values: z.array(z.string()),
                  lifestyle: z.string(),
                  personality: z.string(),
                })
                .optional(),
              jobsToBeDone: z.array(z.string()).optional(),
              size: z.number().describe("Estimated segment size in thousands"),
              growth: z.number().describe("Estimated annual growth rate percentage"),
              confidenceScore: z.number().min(0).max(1),
              reasoning: z.string(),
            }),
          ),
        }),
        prompt: `You are a market segmentation expert specializing in behavioral analysis, psychographics, and jobs-to-be-done frameworks.

Analyze this market and propose ${input.count} NEW customer segments that go beyond traditional demographics:

Market: ${market.name}
Sector: ${market.sector}
Description: ${market.description}

Existing Segments: ${market.segments.map((s) => s.name).join(", ") || "None"}
Competitors: ${market.competitors.map((c) => c.name).join(", ") || "None"}

${input.segmentationType === "all" ? "Use a mix of behavioral, psychographic, and jobs-to-be-done approaches." : `Focus on ${input.segmentationType} segmentation.`}

For each segment:
1. Identify UNSERVED or UNDERSERVED groups that existing segments miss
2. Focus on behaviors, motivations, and goals rather than demographics
3. For behavioral: What actions, usage patterns, or decision-making processes define them?
4. For psychographic: What values, lifestyles, and personality traits unite them?
5. For jobs-to-be-done: What functional, emotional, and social jobs are they trying to accomplish?
6. Estimate segment size and growth potential
7. Provide confidence score based on available market signals

Think about Blue Ocean opportunities - segments that competitors aren't targeting.`,
      });

      // Create segments in database
      const createdSegments = await Promise.all(
        object.segments.map((segment) =>
          db.segment.create({
            data: {
              marketId: input.marketId,
              name: segment.name,
              characteristics: segment.characteristics,
              size: Math.round(segment.size),
              growth: segment.growth,
              segmentType: segment.segmentType,
              behavioralTraits: segment.behavioralTraits ? JSON.stringify(segment.behavioralTraits) : null,
              psychographics: segment.psychographics ? JSON.stringify(segment.psychographics) : null,
              jobsToBeDone: segment.jobsToBeDone ? JSON.stringify(segment.jobsToBeDone) : null,
              isAiGenerated: true,
              confidenceScore: segment.confidenceScore,
              dataSource: `AI analysis - ${segment.reasoning}`,
            },
          }),
        ),
      );

      return {
        segments: createdSegments,
        count: createdSegments.length,
      };
    } catch (error) {
      console.error("Failed to generate dynamic segments:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate segments. Please try again.",
      });
    }
  });
