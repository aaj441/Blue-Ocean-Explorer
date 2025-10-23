import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createBoard = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      stage: z.enum(["exploring", "validating", "building", "live"]).default("exploring"),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const board = await db.board.create({
      data: {
        userId: user.id,
        name: input.name,
        description: input.description,
        stage: input.stage,
      },
    });
    
    return board;
  });
