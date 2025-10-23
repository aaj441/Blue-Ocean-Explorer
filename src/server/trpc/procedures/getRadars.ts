import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getRadars = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const radars = await db.radar.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return radars;
  });
