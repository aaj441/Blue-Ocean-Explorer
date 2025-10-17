import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const submitProblemSolution = baseProcedure
  .input(
    z.object({
      token: z.string(),
      problemId: z.number(),
      title: z.string().min(10, "Title must be at least 10 characters"),
      description: z.string().min(50, "Description must be at least 50 characters"),
      approach: z.string().min(100, "Approach must be at least 100 characters"),
      scenarioId: z.number().optional(),
      opportunityId: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify problem exists and is open
    const problem = await db.problem.findUnique({
      where: { id: input.problemId },
    });

    if (!problem) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Problem not found",
      });
    }

    if (problem.status !== "open") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This problem is no longer accepting solutions",
      });
    }

    if (problem.userId === user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot submit a solution to your own problem",
      });
    }

    // Check if user already submitted
    const existingSolution = await db.problemSolution.findUnique({
      where: {
        problemId_userId: {
          problemId: input.problemId,
          userId: user.id,
        },
      },
    });

    if (existingSolution) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already submitted a solution to this problem",
      });
    }

    let aiScore: number | undefined;

    // Generate AI quality score
    if (env.OPENROUTER_API_KEY) {
      try {
        const openrouter = createOpenRouter({
          apiKey: env.OPENROUTER_API_KEY,
        });

        const model = openrouter("openai/gpt-4o");

        const { object } = await generateObject({
          model,
          schema: z.object({
            qualityScore: z.number().min(0).max(100),
            strengths: z.array(z.string()),
            weaknesses: z.array(z.string()),
            innovationLevel: z.number().min(0).max(100),
            feasibilityScore: z.number().min(0).max(100),
          }),
          prompt: `Evaluate this solution to a problem using Blue Ocean Strategy principles.

PROBLEM:
${problem.title}
${problem.description}

SOLUTION:
${input.title}
${input.description}

APPROACH:
${input.approach}

Evaluate based on:
1. **Innovation**: Does it create new value or just compete in existing space?
2. **Feasibility**: Can it realistically be implemented?
3. **Value Innovation**: Does it simultaneously pursue differentiation AND low cost?
4. **Market Creation**: Does it open new market space?
5. **Completeness**: Is the solution well thought out and detailed?

Provide a quality score (0-100) and identify strengths and weaknesses.`,
        });

        aiScore = object.qualityScore;
      } catch (error) {
        console.error("Failed to generate AI score:", error);
        // Continue without AI score
      }
    }

    // Create solution
    const solution = await db.problemSolution.create({
      data: {
        problemId: input.problemId,
        userId: user.id,
        title: input.title,
        description: input.description,
        approach: input.approach,
        scenarioId: input.scenarioId,
        opportunityId: input.opportunityId,
        aiScore,
      },
    });

    // Update problem solution count
    await db.problem.update({
      where: { id: input.problemId },
      data: {
        solutionCount: { increment: 1 },
      },
    });

    return solution;
  });
