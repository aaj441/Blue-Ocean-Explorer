import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateScenario = baseProcedure
  .input(
    z.object({
      token: z.string(),
      scenarioId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      marketSize: z.number().optional(),
      marketGrowth: z.number().optional(),
      competitorCount: z.number().optional(),
      pricing: z.number().optional(),
      costStructure: z.number().optional(),
      timeToMarket: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify scenario exists and user has access
    const scenario = await db.scenario.findUnique({
      where: { id: input.scenarioId },
      include: {
        opportunity: {
          include: {
            segment: {
              include: {
                market: true,
              },
            },
          },
        },
      },
    });

    if (!scenario) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Scenario not found",
      });
    }

    if (scenario.opportunity.segment.market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this scenario",
      });
    }

    const updatedScenario = await db.scenario.update({
      where: { id: input.scenarioId },
      data: {
        name: input.name,
        description: input.description,
        marketSize: input.marketSize,
        marketGrowth: input.marketGrowth,
        competitorCount: input.competitorCount,
        pricing: input.pricing,
        costStructure: input.costStructure,
        timeToMarket: input.timeToMarket,
      },
    });

    return updatedScenario;
  });
