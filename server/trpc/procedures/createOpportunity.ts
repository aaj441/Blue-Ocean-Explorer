import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { protectedProcedure } from "~/server/trpc/main";
import { createOpportunitySchema } from "~/server/utils/validation";
import { logger } from "~/server/utils/logger";
import { sanitizeObject } from "~/server/utils/security";
import { NotFoundError, AuthorizationError } from "~/server/utils/errors";

export const createOpportunity = protectedProcedure
  .input(createOpportunitySchema)
  .mutation(async ({ input, ctx }) => {
    const { user } = ctx;
    
    // Sanitize input
    const sanitizedInput = sanitizeObject(input);
    
    // Verify market exists and user has access
    const market = await db.market.findUnique({
      where: { id: sanitizedInput.marketId },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (!market) {
      throw new NotFoundError("Market");
    }

    if (market.userId !== user.id) {
      throw new AuthorizationError("You do not have access to this market");
    }

    // Create opportunity
    const opportunity = await db.opportunity.create({
      data: {
        title: sanitizedInput.title,
        description: sanitizedInput.description,
        category: sanitizedInput.category,
        priority: sanitizedInput.priority,
        status: sanitizedInput.status,
        potential: sanitizedInput.potential,
        difficulty: sanitizedInput.difficulty,
        timeframe: sanitizedInput.timeframe,
        tags: sanitizedInput.tags,
        marketId: sanitizedInput.marketId,
        userId: user.id,
      },
      include: {
        market: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            scenarios: true,
            boardOpportunities: true,
          },
        },
      },
    });

    // Log opportunity creation
    logger.info('Opportunity created', {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      marketId: market.id,
      marketName: market.name,
      userId: user.id,
      category: opportunity.category,
      priority: opportunity.priority,
    });

    return opportunity;
  });
