import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getOpportunityConnections = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Verify market access
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
    
    // Get all opportunities in the market
    const opportunities = await db.opportunity.findMany({
      where: {
        segment: {
          marketId: input.marketId,
        },
      },
      select: {
        id: true,
      },
    });
    
    const opportunityIds = opportunities.map(o => o.id);
    
    // Get all connections where both source and target are in this market
    const connections = await db.opportunityConnection.findMany({
      where: {
        AND: [
          { sourceOpportunityId: { in: opportunityIds } },
          { targetOpportunityId: { in: opportunityIds } },
        ],
      },
      include: {
        sourceOpportunity: {
          select: {
            id: true,
            title: true,
            status: true,
            score: true,
          },
        },
        targetOpportunity: {
          select: {
            id: true,
            title: true,
            status: true,
            score: true,
          },
        },
      },
    });
    
    return connections;
  });
