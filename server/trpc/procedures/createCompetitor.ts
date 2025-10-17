import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createCompetitor = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      name: z.string().min(1, "Competitor name is required"),
      strengths: z.string(),
      weaknesses: z.string(),
      marketShare: z.number().min(0).max(100).optional(),
      positioning: z.string().optional(),
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

    const competitor = await db.competitor.create({
      data: {
        marketId: input.marketId,
        name: input.name,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        marketShare: input.marketShare,
        positioning: input.positioning,
      },
    });

    return competitor;
  });
