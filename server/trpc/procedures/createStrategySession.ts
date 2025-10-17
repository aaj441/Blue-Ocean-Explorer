import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createStrategySession = baseProcedure
  .input(
    z.object({
      token: z.string(),
      title: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const session = await db.strategySession.create({
      data: {
        userId: user.id,
        title: input.title || "Strategy Session",
        messages: JSON.stringify([]),
        context: JSON.stringify([]),
      },
    });
    
    return session;
  });
