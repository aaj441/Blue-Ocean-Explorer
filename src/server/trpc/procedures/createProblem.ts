import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createProblem = baseProcedure
  .input(
    z.object({
      token: z.string(),
      title: z.string().min(10, "Title must be at least 10 characters"),
      description: z.string().min(50, "Description must be at least 50 characters"),
      category: z.string(),
      bounty: z.number().min(10, "Minimum bounty is 10 credits"),
      industry: z.string().optional(),
      tags: z.array(z.string()).optional(),
      expiresInDays: z.number().min(7).max(90).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Check credit balance
    const creditBalance = await db.creditBalance.findUnique({
      where: { userId: user.id },
    });

    if (!creditBalance || creditBalance.balance < input.bounty) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient credits to post this bounty",
      });
    }

    // Calculate expiration date
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create problem
    const problem = await db.problem.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        bounty: input.bounty,
        industry: input.industry,
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
        expiresAt,
      },
    });

    // Deduct credits (hold in escrow)
    await db.creditBalance.update({
      where: { userId: user.id },
      data: {
        balance: { decrement: input.bounty },
      },
    });

    await db.creditTransaction.create({
      data: {
        balanceId: creditBalance.id,
        amount: -input.bounty,
        type: "problem_bounty_escrow",
        description: `Bounty for problem: ${input.title}`,
        referenceId: problem.id.toString(),
      },
    });

    return problem;
  });
