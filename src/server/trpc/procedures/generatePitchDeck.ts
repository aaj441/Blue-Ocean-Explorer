import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const generatePitchDeck = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      scenarioId: z.number().optional(),
      format: z.enum(["standard", "investor", "executive", "detailed"]).default("standard"),
      theme: z.enum(["professional", "modern", "creative"]).default("professional"),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const opportunity = await db.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        segment: {
          include: {
            market: {
              include: {
                competitors: true,
              },
            },
          },
        },
        insight: true,
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

    let scenario = null;
    if (input.scenarioId) {
      scenario = await db.scenario.findUnique({
        where: { id: input.scenarioId },
      });

      if (!scenario || scenario.opportunityId !== input.opportunityId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scenario does not belong to this opportunity",
        });
      }
    }

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    try {
      const startTime = Date.now();

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const { object } = await generateObject({
        model,
        schema: z.object({
          title: z.string(),
          subtitle: z.string(),
          slides: z.array(
            z.object({
              title: z.string(),
              type: z.enum([
                "cover",
                "problem",
                "solution",
                "market",
                "product",
                "business_model",
                "traction",
                "competition",
                "financials",
                "team",
                "ask",
              ]),
              content: z.string(),
              bulletPoints: z.array(z.string()).optional(),
              visualSuggestion: z.string().optional(),
              speakerNotes: z.string().optional(),
            }),
          ),
        }),
        prompt: `You are an expert pitch deck creator. Generate a compelling ${input.format} pitch deck for investors.

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Market: ${opportunity.segment.market.name}
Sector: ${opportunity.segment.market.sector}
Market Size: ${opportunity.segment.size ? `${opportunity.segment.size}k` : "TBD"}
Competitors: ${opportunity.segment.market.competitors.length}

${scenario ? `Scenario: ${scenario.name}
Revenue Projection: ${scenario.projectedRevenue ? `$${scenario.projectedRevenue}M` : "TBD"}
Market Share: ${scenario.projectedMarketShare ? `${scenario.projectedMarketShare}%` : "TBD"}
ROI: ${scenario.projectedROI ? `${scenario.projectedROI}%` : "TBD"}
Risk Assessment: ${scenario.riskAssessment || "TBD"}
` : ""}

Create a ${input.format === "investor" ? "10-12" : input.format === "executive" ? "8-10" : "12-15"} slide pitch deck that tells a compelling story.

Standard slides to include:
1. Cover: Company name, tagline, vision
2. Problem: The pain point or unmet need
3. Solution: Your unique approach
4. Market Opportunity: TAM, SAM, SOM
5. Product/Service: What you're building
6. Business Model: How you make money
7. Traction: Progress, metrics, validation
8. Competition: Competitive landscape and differentiation
9. Financials: Projections, unit economics
10. Team: Who's building this
11. Ask: What you need from investors

For each slide:
- Write clear, concise content
- Provide bullet points for key messages
- Suggest visual elements (charts, images, icons)
- Include speaker notes for presentation

Focus on the Blue Ocean strategy angle - emphasize value innovation, market creation, and differentiation.
Make it investor-ready with clear ROI story and risk mitigation.`,
      });

      const generationTime = (Date.now() - startTime) / 1000;

      // Create pitch deck in database
      const pitchDeck = await db.pitchDeck.create({
        data: {
          userId: user.id,
          opportunityId: input.opportunityId,
          scenarioId: input.scenarioId,
          title: object.title,
          slides: JSON.stringify(object.slides),
          format: input.format,
          theme: input.theme,
          generationTime,
        },
      });

      return pitchDeck;
    } catch (error) {
      console.error("Failed to generate pitch deck:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate pitch deck. Please try again.",
      });
    }
  });
