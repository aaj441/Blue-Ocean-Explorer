import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const checkFeatureAccess = baseProcedure
  .input(
    z.object({
      token: z.string(),
      featureName: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check subscription-based access
    const subscription = await db.userSubscription.findUnique({
      where: { userId: user.id },
      include: { tier: true },
    });

    if (subscription && subscription.status === "active") {
      const features = JSON.parse(subscription.tier.features);
      if (features.includes(input.featureName)) {
        return {
          hasAccess: true,
          accessType: "subscription",
          tier: subscription.tier.name,
        };
      }
    }

    // Check feature access table for one-time purchases
    const featureAccess = await db.featureAccess.findUnique({
      where: {
        userId_featureName: {
          userId: user.id,
          featureName: input.featureName,
        },
      },
    });

    if (featureAccess) {
      // Check if not expired
      if (!featureAccess.expiresAt || featureAccess.expiresAt > new Date()) {
        // Check usage limit
        if (
          !featureAccess.usageLimit ||
          featureAccess.usageCount < featureAccess.usageLimit
        ) {
          return {
            hasAccess: true,
            accessType: featureAccess.accessType,
            usageCount: featureAccess.usageCount,
            usageLimit: featureAccess.usageLimit,
          };
        }
      }
    }

    // Check credit-based access
    const balance = await db.creditBalance.findUnique({
      where: { userId: user.id },
    });

    if (balance && balance.balance > 0) {
      return {
        hasAccess: true,
        accessType: "credits",
        creditsAvailable: balance.balance,
      };
    }

    return {
      hasAccess: false,
      accessType: null,
    };
  });
