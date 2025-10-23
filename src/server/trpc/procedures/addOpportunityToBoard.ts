import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const addOpportunityToBoard = baseProcedure
  .input(
    z.object({
      token: z.string(),
      boardId: z.number(),
      opportunityId: z.number(),
      notes: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Verify board ownership
    const board = await db.board.findUnique({
      where: { id: input.boardId },
    });
    
    if (!board) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Board not found",
      });
    }
    
    if (board.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this board",
      });
    }
    
    // Verify opportunity access
    const opportunity = await db.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        segment: {
          include: {
            market: true,
          },
        },
      },
    });
    
    if (!opportunity) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Opportunity not found",
      });
    }
    
    if (opportunity.segment.market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this opportunity",
      });
    }
    
    // Create the relationship (will fail if already exists due to unique constraint)
    const boardOpportunity = await db.boardOpportunity.create({
      data: {
        boardId: input.boardId,
        opportunityId: input.opportunityId,
        notes: input.notes,
      },
    });
    
    return boardOpportunity;
  });
