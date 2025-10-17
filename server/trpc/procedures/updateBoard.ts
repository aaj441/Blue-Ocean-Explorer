import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateBoard = baseProcedure
  .input(
    z.object({
      token: z.string(),
      boardId: z.number(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      stage: z.enum(["exploring", "validating", "building", "live"]).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
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
    
    const updatedBoard = await db.board.update({
      where: { id: input.boardId },
      data: {
        name: input.name,
        description: input.description,
        stage: input.stage,
      },
    });
    
    return updatedBoard;
  });
