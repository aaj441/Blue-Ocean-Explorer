import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getValueMigrations = baseProcedure
  .input(
    z.object({
      token: z.string(),
      timeline: z.enum(["short_term", "medium_term", "long_term"]).optional(),
      fromIndustry: z.string().optional(),
      toIndustry: z.string().optional(),
      minConfidence: z.number().min(0).max(1).optional(),
      limit: z.number().default(20),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {};

    if (input.timeline) {
      where.timeline = input.timeline;
    }

    if (input.fromIndustry) {
      where.fromIndustry = { contains: input.fromIndustry, mode: "insensitive" };
    }

    if (input.toIndustry) {
      where.toIndustry = { contains: input.toIndustry, mode: "insensitive" };
    }

    if (input.minConfidence !== undefined) {
      where.confidence = { gte: input.minConfidence };
    }

    const migrations = await db.valueMigration.findMany({
      where,
      orderBy: [
        { confidence: "desc" },
        { createdAt: "desc" },
      ],
      take: input.limit,
    });

    // Parse JSON fields
    const migrationsWithParsedData = migrations.map((migration) => ({
      ...migration,
      migrationDrivers: JSON.parse(migration.migrationDrivers),
      relatedTrends: migration.relatedTrends ? JSON.parse(migration.relatedTrends) : null,
    }));

    return migrationsWithParsedData;
  });
