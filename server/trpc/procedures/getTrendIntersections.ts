import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getTrendIntersections = baseProcedure
  .input(
    z.object({
      token: z.string(),
      intersectionType: z.enum(["convergence", "collision", "synergy", "disruption"]).optional(),
      minStrength: z.number().min(0).max(1).optional(),
      onlyUnexpected: z.boolean().optional(),
      limit: z.number().default(20),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {};

    if (input.intersectionType) {
      where.intersectionType = input.intersectionType;
    }

    if (input.minStrength !== undefined) {
      where.strength = { gte: input.minStrength };
    }

    if (input.onlyUnexpected) {
      where.isUnexpected = true;
    }

    const intersections = await db.trendIntersection.findMany({
      where,
      orderBy: [
        { strength: "desc" },
        { createdAt: "desc" },
      ],
      take: input.limit,
    });

    // Parse trendIds JSON
    const intersectionsWithParsedIds = intersections.map((intersection) => ({
      ...intersection,
      trendIds: JSON.parse(intersection.trendIds) as number[],
    }));

    return intersectionsWithParsedIds;
  });
