import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createSegment = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      name: z.string().min(1, "Segment name is required"),
      characteristics: z.string(),
      size: z.number().optional(),
      growth: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify market exists and user has access
    const market = await db.market.findUnique({
      where: { id: input.marketId },
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

    const segment = await db.segment.create({
      data: {
        marketId: input.marketId,
        name: input.name,
        characteristics: input.characteristics,
        size: input.size,
        growth: input.growth,
      },
    });

    return segment;
  });
