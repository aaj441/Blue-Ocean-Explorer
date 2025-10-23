import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const voteOnSubmission = baseProcedure
  .input(
    z.object({
      token: z.string(),
      submissionId: z.number(),
      score: z.number().min(1).max(5),
      comment: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const submission = await db.challengeSubmission.findUnique({
      where: { id: input.submissionId },
      include: {
        challenge: true,
      },
    });

    if (!submission) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Submission not found",
      });
    }

    // Can't vote on your own submission
    if (submission.userId === user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot vote on your own submission",
      });
    }

    // Check if already voted
    const existingVote = await db.challengeVote.findUnique({
      where: {
        submissionId_voterId: {
          submissionId: input.submissionId,
          voterId: user.id,
        },
      },
    });

    if (existingVote) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already voted on this submission",
      });
    }

    const vote = await db.$transaction(async (tx) => {
      // Create vote
      const newVote = await tx.challengeVote.create({
        data: {
          submissionId: input.submissionId,
          voterId: user.id,
          score: input.score,
          comment: input.comment,
        },
      });

      // Update submission vote count and peer score
      const allVotes = await tx.challengeVote.findMany({
        where: { submissionId: input.submissionId },
      });

      const avgScore =
        allVotes.reduce((sum, v) => sum + v.score, 0) / allVotes.length;

      await tx.challengeSubmission.update({
        where: { id: input.submissionId },
        data: {
          voteCount: allVotes.length,
          peerScore: avgScore * 20, // Convert 1-5 scale to 0-100
        },
      });

      return newVote;
    });

    return { vote };
  });
