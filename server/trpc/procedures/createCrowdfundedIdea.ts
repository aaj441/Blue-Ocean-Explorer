import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const createCrowdfundedIdea = baseProcedure
  .input(
    z.object({
      token: z.string(),
      title: z.string().min(10, "Title must be at least 10 characters"),
      description: z.string().min(50, "Description must be at least 50 characters"),
      pitch: z.string().min(200, "Pitch must be at least 200 characters"),
      fundingGoal: z.number().min(1000, "Minimum funding goal is $1,000"),
      minInvestment: z.number().min(10, "Minimum investment must be at least $10"),
      maxInvestment: z.number().optional(),
      equity: z.number().min(0).max(100).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      opportunityId: z.number().optional(),
      scenarioId: z.number().optional(),
      durationDays: z.number().min(7).max(90).default(30),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    // Verify opportunity/scenario access if provided
    if (input.opportunityId) {
      const opportunity = await db.opportunity.findUnique({
        where: { id: input.opportunityId },
        include: {
          segment: {
            include: {
              market: true,
            },
          },
        },
      });

      if (!opportunity || opportunity.segment.market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this opportunity",
        });
      }
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      // Generate AI risk and return estimates
      const { object } = await generateObject({
        model,
        schema: z.object({
          riskScore: z.number().min(0).max(1).describe("Risk score from 0 (low risk) to 1 (high risk)"),
          returnEstimate: z.number().describe("Estimated annual return percentage"),
          riskFactors: z.array(z.string()),
          opportunityFactors: z.array(z.string()),
          marketPotential: z.enum(["low", "medium", "high"]),
          innovationLevel: z.enum(["incremental", "moderate", "disruptive"]),
          timeToReturn: z.number().describe("Estimated months to first returns"),
          confidenceLevel: z.number().min(0).max(100),
        }),
        prompt: `Analyze this crowdfunding idea and estimate investment risk and returns.

IDEA:
${input.title}

DESCRIPTION:
${input.description}

PITCH:
${input.pitch}

FUNDING GOAL: $${input.fundingGoal}
${input.equity ? `EQUITY OFFERED: ${input.equity}%` : ""}

Evaluate based on:
1. **Market Opportunity**: Is there a real, sizable market?
2. **Innovation**: How novel and differentiated is this?
3. **Execution Risk**: How feasible is implementation?
4. **Competitive Landscape**: Is this a blue ocean or red ocean?
5. **Business Model**: Is the monetization strategy sound?
6. **Team/Resources**: Are the required resources realistic?

Provide:
- Risk score (0-1): 0 = very safe, 1 = very risky
- Return estimate: Expected annual return percentage
- Risk factors: Key risks to consider
- Opportunity factors: Key upside potential
- Time to return: Estimated months to see returns
- Confidence level: How confident are you in this assessment?

Be realistic but consider blue ocean potential - market-creating innovations can have outsized returns.`,
      });

      const deadline = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);

      // Create crowdfunded idea
      const idea = await db.crowdfundedIdea.create({
        data: {
          userId: user.id,
          title: input.title,
          description: input.description,
          pitch: input.pitch,
          fundingGoal: input.fundingGoal,
          minInvestment: input.minInvestment,
          maxInvestment: input.maxInvestment,
          equity: input.equity,
          category: input.category,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
          opportunityId: input.opportunityId,
          scenarioId: input.scenarioId,
          aiRiskScore: object.riskScore,
          aiReturnEstimate: object.returnEstimate,
          deadline,
        },
      });

      return {
        idea,
        aiAnalysis: {
          riskScore: object.riskScore,
          returnEstimate: object.returnEstimate,
          riskFactors: object.riskFactors,
          opportunityFactors: object.opportunityFactors,
          marketPotential: object.marketPotential,
          innovationLevel: object.innovationLevel,
          timeToReturn: object.timeToReturn,
          confidenceLevel: object.confidenceLevel,
        },
      };
    } catch (error) {
      console.error("Failed to create crowdfunded idea:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create crowdfunded idea. Please try again.",
      });
    }
  });
