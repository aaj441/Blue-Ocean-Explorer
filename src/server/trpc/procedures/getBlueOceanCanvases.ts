import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getBlueOceanCanvases = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      opportunityId: z.number().optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const whereClause: any = {
      userId: user.id,
    };

    if (input.marketId) {
      whereClause.marketId = input.marketId;
    }

    if (input.opportunityId) {
      whereClause.opportunityId = input.opportunityId;
    }

    const canvases = await db.blueOceanCanvas.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return canvases;
  });
