import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateOpportunityScore = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      score: z.number().min(0).max(100),
      risk: z.enum(["low", "medium", "high"]),
      roi: z.number().optional(),
      status: z
        .enum(["identified", "analyzing", "approved", "rejected"])
        .optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify opportunity exists and user has access
    const opportunity = await db.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        segment: {
          include: { market: true },
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

    const updated = await db.opportunity.update({
      where: { id: input.opportunityId },
      data: {
        score: input.score,
        risk: input.risk,
        roi: input.roi,
        status: input.status,
      },
    });

    return updated;
  });
