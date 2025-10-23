import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getCreditBalance = baseProcedure
  .input(
    z.object({
      token: z.string(),
      includeTransactions: z.boolean().optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const balance = await db.creditBalance.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        transactions: input.includeTransactions
          ? {
              orderBy: {
                createdAt: "desc",
              },
              take: 50,
            }
          : false,
      },
    });

    // Create balance if it doesn't exist
    if (!balance) {
      const newBalance = await db.creditBalance.create({
        data: {
          userId: user.id,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        },
      });

      return {
        balance: newBalance.balance,
        lifetimeEarned: newBalance.lifetimeEarned,
        lifetimeSpent: newBalance.lifetimeSpent,
        transactions: [],
      };
    }

    return {
      balance: balance.balance,
      lifetimeEarned: balance.lifetimeEarned,
      lifetimeSpent: balance.lifetimeSpent,
      transactions: balance.transactions || [],
    };
  });
