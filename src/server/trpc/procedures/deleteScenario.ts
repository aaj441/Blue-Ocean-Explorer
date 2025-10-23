import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const deleteScenario = baseProcedure
  .input(
    z.object({
      token: z.string(),
      scenarioId: z.number(),
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

    await db.scenario.delete({
      where: { id: input.scenarioId },
    });

    return { success: true };
  });
