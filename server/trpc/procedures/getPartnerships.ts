import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getPartnerships = baseProcedure
  .input(
    z.object({
      token: z.string(),
      partnerType: z.enum(["cross_industry", "complementary", "ecosystem", "platform"]).optional(),
      status: z.enum(["suggested", "exploring", "in_progress", "established"]).optional(),
      minConfidence: z.number().min(0).max(1).optional(),
      limit: z.number().default(20),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {
      userId: user.id,
    };

    if (input.partnerType) {
      where.partnerType = input.partnerType;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.minConfidence !== undefined) {
      where.confidenceScore = { gte: input.minConfidence };
    }

    const partnerships = await db.partnership.findMany({
      where,
      orderBy: [
        { confidenceScore: "desc" },
        { createdAt: "desc" },
      ],
      take: input.limit,
    });

    // Parse JSON fields
    const partnershipsWithParsedData = partnerships.map((partnership) => ({
      ...partnership,
      synergies: JSON.parse(partnership.synergies),
      dataCompatibility: JSON.parse(partnership.dataCompatibility),
      implementationPath: partnership.implementationPath ? JSON.parse(partnership.implementationPath) : null,
    }));

    return partnershipsWithParsedData;
  });
