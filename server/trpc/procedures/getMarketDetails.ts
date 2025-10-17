import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getMarketDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      // Trend filters
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      // Segment filters
      minSize: z.number().optional(),
      maxSize: z.number().optional(),
      minGrowth: z.number().optional(),
      maxGrowth: z.number().optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Build trends where clause
    const trendsWhere: any = {};
    if (input.startDate || input.endDate) {
      trendsWhere.createdAt = {};
      if (input.startDate) {
        trendsWhere.createdAt.gte = new Date(input.startDate);
      }
      if (input.endDate) {
        trendsWhere.createdAt.lte = new Date(input.endDate);
      }
    }

    // Build segments where clause
    const segmentsWhere: any = {};
    if (input.minSize !== undefined || input.maxSize !== undefined) {
      segmentsWhere.size = {};
      if (input.minSize !== undefined) {
        segmentsWhere.size.gte = input.minSize;
      }
      if (input.maxSize !== undefined) {
        segmentsWhere.size.lte = input.maxSize;
      }
    }
    if (input.minGrowth !== undefined || input.maxGrowth !== undefined) {
      segmentsWhere.growth = {};
      if (input.minGrowth !== undefined) {
        segmentsWhere.growth.gte = input.minGrowth;
      }
      if (input.maxGrowth !== undefined) {
        segmentsWhere.growth.lte = input.maxGrowth;
      }
    }

    const market = await db.market.findUnique({
      where: { id: input.marketId },
      include: {
        segments: {
          where: segmentsWhere,
          include: {
            opportunities: true,
          },
        },
        competitors: true,
        trends: {
          where: trendsWhere,
          orderBy: { createdAt: "desc" },
          take: 10,
        },
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

    return market;
  });
