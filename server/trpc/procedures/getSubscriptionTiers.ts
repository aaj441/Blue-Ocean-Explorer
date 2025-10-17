import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getSubscriptionTiers = baseProcedure
  .input(z.object({}).optional())
  .query(async () => {
    const tiers = await db.subscriptionTier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    return tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      features: JSON.parse(tier.features),
      creditsPerMonth: tier.creditsPerMonth,
      maxScenarios: tier.maxScenarios,
      maxRadars: tier.maxRadars,
      maxBoards: tier.maxBoards,
    }));
  });
