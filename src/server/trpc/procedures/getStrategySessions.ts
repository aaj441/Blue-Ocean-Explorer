import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getStrategySessions = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const sessions = await db.strategySession.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    
    return sessions;
  });
