import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getChallenges = baseProcedure
  .input(
    z.object({
      token: z.string(),
      status: z.enum(["active", "judging", "completed"]).optional(),
      challengeType: z.enum(["blue_ocean_scenario", "market_discovery", "value_innovation"]).optional(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const where: any = {};

    if (input.status) {
      where.status = input.status;
    }

    if (input.challengeType) {
      where.challengeType = input.challengeType;
    }

    const challenges = await db.challenge.findMany({
      where,
      orderBy: {
        startDate: "desc",
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    // Get user's submissions for each challenge
    const userSubmissions = await db.challengeSubmission.findMany({
      where: {
        userId: user.id,
        challengeId: { in: challenges.map((c) => c.id) },
      },
      select: {
        challengeId: true,
        id: true,
      },
    });

    const submissionMap = new Map(
      userSubmissions.map((s) => [s.challengeId, s.id]),
    );

    return challenges.map((challenge) => ({
      ...challenge,
      userSubmissionId: submissionMap.get(challenge.id) || null,
    }));
  });
