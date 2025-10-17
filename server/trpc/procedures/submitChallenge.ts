import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const submitChallenge = baseProcedure
  .input(
    z.object({
      token: z.string(),
      challengeId: z.number(),
      scenarioId: z.number().optional(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      content: z.any(), // JSON content
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const challenge = await db.challenge.findUnique({
      where: { id: input.challengeId },
    });

    if (!challenge) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Challenge not found",
      });
    }

    if (challenge.status !== "active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Challenge is not accepting submissions",
      });
    }

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Challenge is not currently open for submissions",
      });
    }

    // Check if user already submitted
    const existingSubmission = await db.challengeSubmission.findUnique({
      where: {
        challengeId_userId: {
          challengeId: input.challengeId,
          userId: user.id,
        },
      },
    });

    if (existingSubmission) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already submitted to this challenge",
      });
    }

    const submission = await db.$transaction(async (tx) => {
      const newSubmission = await tx.challengeSubmission.create({
        data: {
          challengeId: input.challengeId,
          userId: user.id,
          scenarioId: input.scenarioId,
          title: input.title,
          description: input.description,
          content: JSON.stringify(input.content),
        },
      });

      // Update participant count
      await tx.challenge.update({
        where: { id: input.challengeId },
        data: {
          participantCount: { increment: 1 },
        },
      });

      return newSubmission;
    });

    return { submission };
  });
