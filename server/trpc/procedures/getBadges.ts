import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getBadges = baseProcedure
  .input(
    z.object({
      token: z.string(),
      category: z.enum(["discovery", "innovation", "collaboration", "expertise"]).optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {};
    if (input.category) {
      where.category = input.category;
    }

    const badges = await db.badge.findMany({
      where,
      orderBy: {
        rarity: "asc",
      },
    });

    const userBadges = await db.userBadge.findMany({
      where: {
        userId: user.id,
      },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

    return {
      allBadges: badges.map((badge) => ({
        ...badge,
        isEarned: earnedBadgeIds.has(badge.id),
      })),
      userBadges,
    };
  });
