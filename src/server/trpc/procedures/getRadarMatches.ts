import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getRadarMatches = baseProcedure
  .input(
    z.object({
      token: z.string(),
      radarId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const radar = await db.radar.findUnique({
      where: { id: input.radarId },
    });
    
    if (!radar) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Radar not found",
      });
    }
    
    if (radar.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this radar",
      });
    }
    
    const criteria = JSON.parse(radar.criteria);
    
    // Build where clause based on criteria
    const whereClause: any = {
      segment: {
        market: {
          userId: user.id,
        },
      },
    };
    
    // Filter by industries (via market sector)
    if (criteria.industries && criteria.industries.length > 0) {
      whereClause.segment.market.sector = {
        in: criteria.industries,
      };
    }
    
    // Filter by entry barrier
    if (criteria.maxEntryBarrier) {
      const barrierOrder = { low: 1, medium: 2, high: 3 };
      const maxLevel = barrierOrder[criteria.maxEntryBarrier as keyof typeof barrierOrder];
      whereClause.entryBarrier = {
        in: Object.entries(barrierOrder)
          .filter(([_, level]) => level <= maxLevel)
          .map(([barrier]) => barrier),
      };
    }
    
    // Fetch opportunities
    const opportunities = await db.opportunity.findMany({
      where: whereClause,
      include: {
        segment: {
          include: {
            market: true,
          },
        },
        insight: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to recent matches
    });
    
    // Additional filtering for keywords (in-memory)
    let filteredOpportunities = opportunities;
    if (criteria.keywords && criteria.keywords.length > 0) {
      const keywords = criteria.keywords.map((k: string) => k.toLowerCase());
      filteredOpportunities = opportunities.filter((opp) => {
        const searchText = `${opp.title} ${opp.description}`.toLowerCase();
        return keywords.some((keyword: string) => searchText.includes(keyword));
      });
    }
    
    // Update radar with match count and last checked time
    await db.radar.update({
      where: { id: input.radarId },
      data: {
        matchCount: filteredOpportunities.length,
        lastChecked: new Date(),
      },
    });
    
    return filteredOpportunities;
  });
