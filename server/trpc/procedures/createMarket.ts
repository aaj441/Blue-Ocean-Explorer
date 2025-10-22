import { db } from "~/server/db";
import { protectedProcedure } from "~/server/trpc/main";
import { createMarketSchema } from "~/server/utils/validation";
import { logger } from "~/server/utils/logger";
import { sanitizeObject } from "~/server/utils/security";

export const createMarket = protectedProcedure
  .input(createMarketSchema)
  .mutation(async ({ input, ctx }) => {
    const { user } = ctx;
    
    // Sanitize input
    const sanitizedInput = sanitizeObject(input);
    
    // Create market
    const market = await db.market.create({
      data: {
        name: sanitizedInput.name,
        description: sanitizedInput.description,
        industry: sanitizedInput.industry, // Updated field name to match schema
        size: sanitizedInput.size,
        growth: sanitizedInput.growth,
        trends: sanitizedInput.trends || [],
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            competitors: true,
            segments: true,
          },
        },
      },
    });

    // Log market creation
    logger.info('Market created', {
      marketId: market.id,
      marketName: market.name,
      userId: user.id,
      industry: market.industry,
    });

    return market;
  });
