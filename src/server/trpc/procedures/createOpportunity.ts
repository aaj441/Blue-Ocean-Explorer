import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createOpportunity = baseProcedure
  .input(
    z.object({
      token: z.string(),
      segmentId: z.number(),
      title: z.string().min(1, "Title is required"),
      description: z.string(),
      revenue: z.number().optional(),
      entryBarrier: z.string().optional(),
      strategicFit: z.number().min(0).max(10).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify segment exists and user has access
    const segment = await db.segment.findUnique({
      where: { id: input.segmentId },
      include: { market: true },
    });

    if (!segment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Segment not found",
      });
    }

    if (segment.market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this segment",
      });
    }

    const opportunity = await db.opportunity.create({
      data: {
        segmentId: input.segmentId,
        title: input.title,
        description: input.description,
        revenue: input.revenue,
        entryBarrier: input.entryBarrier,
        strategicFit: input.strategicFit,
      },
    });

    return opportunity;
  });
