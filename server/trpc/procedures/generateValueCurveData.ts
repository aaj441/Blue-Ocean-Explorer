import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generateValueCurveData = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      opportunityId: z.number().optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify market access
    const market = await db.market.findUnique({
      where: { id: input.marketId },
      include: {
        competitors: true,
        segments: true,
      },
    });

    if (!market || market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this market",
      });
    }

    let opportunity;
    if (input.opportunityId) {
      opportunity = await db.opportunity.findUnique({
        where: { id: input.opportunityId },
        include: {
          segment: true,
        },
      });

      if (!opportunity || opportunity.segment.marketId !== input.marketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Opportunity does not belong to this market",
        });
      }
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
          factors: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              industryAverage: z.number().min(0).max(10),
              importance: z.enum(["low", "medium", "high"]),
            }),
          ),
          competitors: z.array(
            z.object({
              name: z.string(),
              scores: z.record(z.number().min(0).max(10)),
            }),
          ),
          blueOceanProfile: z.object({
            name: z.string(),
            scores: z.record(z.number().min(0).max(10)),
            eliminatedFactors: z.array(z.string()),
            reducedFactors: z.array(z.string()),
            raisedFactors: z.array(z.string()),
            createdFactors: z.array(z.string()),
          }),
          insights: z.array(z.string()),
        }),
        prompt: `Analyze this market and generate a Blue Ocean Strategy Value Curve.

MARKET: ${market.name}
SECTOR: ${market.sector}
DESCRIPTION: ${market.description}

COMPETITORS:
${market.competitors.map((c) => `
- ${c.name}
  Strengths: ${c.strengths}
  Weaknesses: ${c.weaknesses}
  Market Share: ${c.marketShare || "Unknown"}%
`).join("")}

${opportunity ? `
OPPORTUNITY:
${opportunity.title}
${opportunity.description}
` : ""}

Generate a value curve analysis:

1. **Identify 8-12 key competing factors** in this industry (price, quality, features, service, convenience, etc.)
2. **Score each competitor** on these factors (0-10 scale)
3. **Identify industry average** for each factor
4. **Design a Blue Ocean profile** that:
   - ELIMINATES factors the industry takes for granted
   - REDUCES factors below industry standard
   - RAISES factors above industry standard
   - CREATES factors the industry never offered

The Blue Ocean profile should create a distinct value curve that opens uncontested market space.

Provide insights on how this strategy creates value innovation.`,
      });

      return {
        valueCurve: object,
        market: {
          id: market.id,
          name: market.name,
          sector: market.sector,
        },
      };
    } catch (error) {
      console.error("Failed to generate value curve data:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate value curve data. Please try again.",
      });
    }
  });
