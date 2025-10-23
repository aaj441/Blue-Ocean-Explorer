import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const deleteStrategySession = baseProcedure
  .input(
    z.object({
      token: z.string(),
      sessionId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const session = await db.strategySession.findUnique({
      where: { id: input.sessionId },
    });
    
    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Strategy session not found",
      });
    }
    
    if (session.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this session",
      });
    }
    
    await db.strategySession.delete({
      where: { id: input.sessionId },
    });
    
    return { success: true };
  });
