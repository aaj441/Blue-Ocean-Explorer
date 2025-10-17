import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getOpportunities = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      status: z
        .array(z.enum(["identified", "analyzing", "approved", "rejected"]))
        .optional(),
      minScore: z.number().optional(),
      sortBy: z.enum(["score", "createdAt", "revenue"]).default("score"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const whereClause: any = {
      segment: {
        market: {
          userId: user.id,
        },
      },
    };

    if (input.marketId) {
      whereClause.segment.marketId = input.marketId;
    }

    if (input.status && input.status.length > 0) {
      whereClause.status = { in: input.status };
    }

    if (input.minScore !== undefined) {
      whereClause.score = { gte: input.minScore };
    }

    const opportunities = await db.opportunity.findMany({
      where: whereClause,
      include: {
        segment: {
          include: {
            market: true,
          },
        },
      },
      orderBy: { [input.sortBy]: input.sortOrder },
    });

    return opportunities;
  });
