import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const createBlueOceanCanvas = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      marketId: z.number().optional(),
      opportunityId: z.number().optional(),
      eliminate: z.array(z.string()).default([]),
      reduce: z.array(z.string()).default([]),
      raise: z.array(z.string()).default([]),
      create: z.array(z.string()).default([]),
      generateSuggestions: z.boolean().default(false),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify access to market/opportunity if provided
    if (input.marketId) {
      const market = await db.market.findUnique({
        where: { id: input.marketId },
      });
      if (!market || market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this market",
        });
      }
    }

    if (input.opportunityId) {
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
      if (!opportunity || opportunity.segment.market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this opportunity",
        });
      }
    }

    let eliminate = input.eliminate;
    let reduce = input.reduce;
    let raise = input.raise;
    let create = input.create;
    let valueInnovation: string | undefined;

    // Generate AI suggestions if requested
    if (input.generateSuggestions && env.OPENROUTER_API_KEY) {
      try {
        // Fetch context
        const market = input.marketId
          ? await db.market.findUnique({
              where: { id: input.marketId },
              include: { competitors: true },
            })
          : null;

        const opportunity = input.opportunityId
          ? await db.opportunity.findUnique({
              where: { id: input.opportunityId },
              include: {
                segment: {
                  include: {
                    market: {
                      include: { competitors: true },
                    },
                  },
                },
              },
            })
          : null;

        const openrouter = createOpenRouter({
          apiKey: env.OPENROUTER_API_KEY,
        });

        const model = openrouter("openai/gpt-4o");

        const { object } = await generateObject({
          model,
          schema: z.object({
            eliminate: z.array(z.string()).describe("Factors to eliminate that the industry takes for granted"),
            reduce: z.array(z.string()).describe("Factors to reduce well below industry standards"),
            raise: z.array(z.string()).describe("Factors to raise well above industry standards"),
            create: z.array(z.string()).describe("Factors to create that the industry has never offered"),
            valueInnovation: z.string().describe("Summary of the value innovation strategy"),
          }),
          prompt: `You are a Blue Ocean Strategy expert. Analyze this context and suggest ERRC factors:

${opportunity ? `Opportunity: ${opportunity.title}\nDescription: ${opportunity.description}\n` : ""}
${market ? `Market: ${market.name}\nSector: ${market.sector}\n` : ""}
${market?.competitors.length ? `Competitors: ${market.competitors.map((c) => c.name).join(", ")}\n` : ""}

Canvas: ${input.name}
${input.description ? `Description: ${input.description}\n` : ""}

Apply the ERRC framework to create a Blue Ocean Strategy:

ELIMINATE: What factors that the industry takes for granted should be eliminated?
REDUCE: What factors should be reduced well below the industry's standard?
RAISE: What factors should be raised well above the industry's standard?
CREATE: What factors should be created that the industry has never offered?

Focus on value innovation - simultaneous pursuit of differentiation AND low cost by reconstructing market boundaries.
Suggest 3-5 specific, actionable factors for each category.`,
        });

        eliminate = object.eliminate;
        reduce = object.reduce;
        raise = object.raise;
        create = object.create;
        valueInnovation = object.valueInnovation;
      } catch (error) {
        console.error("Failed to generate ERRC suggestions:", error);
        // Continue without AI suggestions
      }
    }

    const canvas = await db.blueOceanCanvas.create({
      data: {
        userId: user.id,
        name: input.name,
        description: input.description,
        marketId: input.marketId,
        opportunityId: input.opportunityId,
        eliminate: JSON.stringify(eliminate),
        reduce: JSON.stringify(reduce),
        raise: JSON.stringify(raise),
        create: JSON.stringify(create),
        valueInnovation,
      },
    });

    return canvas;
  });
