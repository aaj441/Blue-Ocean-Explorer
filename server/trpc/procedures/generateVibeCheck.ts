import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const generateVibeCheck = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Get opportunity with related data
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
    
    if (!opportunity) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Opportunity not found",
      });
    }
    
    if (opportunity.segment.market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this opportunity",
      });
    }
    
    // Get or create user preferences
    let preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    
    if (!preferences) {
      preferences = await db.userPreferences.create({
        data: {
          userId: user.id,
          values: JSON.stringify(["innovation", "impact", "growth"]),
          energyLevel: "balanced",
          workStyle: "collaborative",
          riskTolerance: "medium",
        },
      });
    }
    
    const userValues = JSON.parse(preferences.values);
    
    // Use AI to generate vibe check
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    const model = openrouter("openai/gpt-4o");
    
    const { object } = await generateObject({
      model,
      schema: z.object({
        alignmentScore: z.number().min(0).max(100),
        alignmentReason: z.string(),
        energyMatch: z.string(),
        riskMatch: z.string(),
        valueAlignment: z.array(z.object({
          value: z.string(),
          aligned: z.boolean(),
          reason: z.string(),
        })),
        recommendation: z.string(),
      }),
      prompt: `Analyze this business opportunity for personal alignment:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Market: ${opportunity.segment.market.name}
Segment: ${opportunity.segment.name}
Risk Level: ${opportunity.risk}
Strategic Fit: ${opportunity.strategicFit || 'unknown'}

User Profile:
- Values: ${userValues.join(", ")}
- Energy Level: ${preferences.energyLevel}
- Work Style: ${preferences.workStyle}
- Risk Tolerance: ${preferences.riskTolerance}

Provide a "vibe check" - assess whether this opportunity truly aligns with who this person is and how they work best. Consider:
1. Does the risk level match their tolerance?
2. Does the opportunity align with their core values?
3. Will it energize or drain them given their energy level?
4. Does it fit their work style?

Be honest and insightful. The goal is to prevent burnout by helping them choose opportunities that genuinely fit.`,
    });
    
    // Store the insight
    const insight = await db.opportunityInsight.upsert({
      where: { opportunityId: opportunity.id },
      update: {
        alignmentScore: object.alignmentScore,
        alignmentReason: object.alignmentReason,
        generatedAt: new Date(),
      },
      create: {
        opportunityId: opportunity.id,
        alignmentScore: object.alignmentScore,
        alignmentReason: object.alignmentReason,
      },
    });
    
    return {
      ...object,
      insight,
    };
  });
