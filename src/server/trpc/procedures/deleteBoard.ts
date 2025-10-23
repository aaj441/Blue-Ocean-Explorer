import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const deleteBoard = baseProcedure
  .input(
    z.object({
      token: z.string(),
      boardId: z.number(),
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
    
    await db.board.delete({
      where: { id: input.boardId },
    });
    
    return { success: true };
  });
