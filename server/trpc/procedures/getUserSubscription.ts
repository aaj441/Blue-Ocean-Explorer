import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getUserSubscription = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const subscription = await db.userSubscription.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        tier: true,
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      tier: {
        id: subscription.tier.id,
        name: subscription.tier.name,
        description: subscription.tier.description,
        price: subscription.tier.price,
        features: JSON.parse(subscription.tier.features),
        creditsPerMonth: subscription.tier.creditsPerMonth,
        maxScenarios: subscription.tier.maxScenarios,
        maxRadars: subscription.tier.maxRadars,
        maxBoards: subscription.tier.maxBoards,
      },
    };
  });
