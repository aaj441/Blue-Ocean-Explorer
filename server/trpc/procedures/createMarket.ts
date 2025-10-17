import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createMarket = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1, "Market name is required"),
      description: z.string(),
      sector: z.string().min(1, "Sector is required"),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const market = await db.market.create({
      data: {
        name: input.name,
        description: input.description,
        sector: input.sector,
        userId: user.id,
      },
    });

    return market;
  });
