import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getBoards = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const boards = await db.board.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            opportunities: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    
    return boards;
  });
