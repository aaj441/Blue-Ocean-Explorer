import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getChallengeDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      challengeId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const challenge = await db.challenge.findUnique({
      where: { id: input.challengeId },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: {
            voteCount: "desc",
          },
        },
      },
    });

    if (!challenge) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Challenge not found",
      });
    }

    // Get user's submission if exists
    const userSubmission = challenge.submissions.find((s) => s.user.id === user.id);

    // Get user's votes
    const userVotes = await db.challengeVote.findMany({
      where: {
        voterId: user.id,
        submission: {
          challengeId: input.challengeId,
        },
      },
      select: {
        submissionId: true,
        score: true,
      },
    });

    const voteMap = new Map(userVotes.map((v) => [v.submissionId, v.score]));

    return {
      challenge,
      userSubmission,
      userVotes: voteMap,
    };
  });
