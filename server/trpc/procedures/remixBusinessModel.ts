import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const remixBusinessModel = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number().optional(),
      scenarioId: z.number().optional(),
      remixStyle: z.enum(["wild", "conservative", "hybrid"]).default("wild"),
      targetIndustries: z.array(z.string()).optional(),
      count: z.number().min(1).max(5).default(3),
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

    let contextData: any = {};

    if (input.scenarioId) {
      const scenario = await db.scenario.findUnique({
        where: { id: input.scenarioId },
        include: {
          opportunity: {
            include: {
              segment: {
                include: {
                  market: true,
                },
              },
            },
          },
        },
      });

      if (!scenario || scenario.opportunity.segment.market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this scenario",
        });
      }

      contextData = {
        name: scenario.name,
        description: scenario.description,
        opportunity: scenario.opportunity.title,
        market: scenario.opportunity.segment.market.name,
        sector: scenario.opportunity.segment.market.sector,
        pricing: scenario.pricing,
        costStructure: scenario.costStructure,
      };
    } else if (input.opportunityId) {
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

      contextData = {
        opportunity: opportunity.title,
        description: opportunity.description,
        market: opportunity.segment.market.name,
        sector: opportunity.segment.market.sector,
      };
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either opportunityId or scenarioId is required",
      });
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const remixInstructions = {
        wild: "Break all conventions. Combine completely unrelated business models. Think Uber + Subscription Box + NFTs. Be radical and unexpected.",
        conservative: "Make measured changes. Combine adjacent business models. Keep core value proposition but remix monetization or delivery.",
        hybrid: "Balance innovation and practicality. Combine 2-3 business models that complement each other. Push boundaries but stay grounded.",
      };

      const { object } = await generateObject({
        model,
        schema: z.object({
          remixes: z.array(
            z.object({
              name: z.string(),
              tagline: z.string(),
              description: z.string(),
              originalElements: z.array(z.string()).describe("Elements from original business model"),
              newElements: z.array(z.string()).describe("New elements added"),
              removedElements: z.array(z.string()).describe("Elements removed/eliminated"),
              inspirationSources: z.array(z.object({
                industry: z.string(),
                businessModel: z.string(),
                elementBorrowed: z.string(),
              })),
              valueProposition: z.string(),
              revenueModel: z.string(),
              targetCustomer: z.string(),
              keyDifferentiators: z.array(z.string()),
              viabilityScore: z.number().min(0).max(100),
              innovationScore: z.number().min(0).max(100),
              implementationComplexity: z.enum(["low", "medium", "high"]),
              estimatedTimeToMarket: z.number().describe("Months"),
              potentialRevenue: z.number().describe("First year revenue in millions"),
            }),
          ),
        }),
        prompt: `You are a business model innovation expert who specializes in creative remixing and recombination.

ORIGINAL BUSINESS MODEL:
${contextData.opportunity ? `Opportunity: ${contextData.opportunity}` : ""}
${contextData.description ? `Description: ${contextData.description}` : ""}
Market: ${contextData.market}
Sector: ${contextData.sector}
${contextData.pricing ? `Current Pricing: $${contextData.pricing}` : ""}
${contextData.costStructure ? `Current Cost Structure: ${contextData.costStructure}%` : ""}

REMIX STYLE: ${input.remixStyle}
${remixInstructions[input.remixStyle]}

${input.targetIndustries && input.targetIndustries.length > 0 ? `Consider borrowing from these industries: ${input.targetIndustries.join(", ")}` : ""}

Generate ${input.count} creative business model remixes. For each:

1. **Break the model apart**: Identify core elements (value prop, revenue model, customer acquisition, delivery mechanism, pricing)
2. **Borrow from other industries**: Find successful patterns from 2-3 completely different industries
3. **Recombine creatively**: Mix original elements with borrowed elements in unexpected ways
4. **Eliminate assumptions**: Remove elements the industry takes for granted
5. **Add new elements**: Create factors the industry has never offered

Think like:
- Airbnb = Hospitality + Peer-to-peer marketplace + Trust systems from eBay
- Spotify = Music + Subscription model from gyms + Algorithms from Netflix
- Peloton = Fitness + Content streaming + Social features from gaming

Make each remix concrete and actionable, not just theoretical. Include realistic viability and innovation scores.`,
      });

      // Optionally save remixes as scenarios
      if (input.opportunityId) {
        await Promise.all(
          object.remixes.map((remix) =>
            db.scenario.create({
              data: {
                opportunityId: input.opportunityId!,
                name: remix.name,
                description: `${remix.tagline}\n\n${remix.description}`,
                isCrossIndustry: true,
                sourceIndustries: JSON.stringify(remix.inspirationSources.map((s) => s.industry)),
                analogies: JSON.stringify(remix.inspirationSources),
                lateralInsights: JSON.stringify({
                  valueProposition: remix.valueProposition,
                  revenueModel: remix.revenueModel,
                  keyDifferentiators: remix.keyDifferentiators,
                }),
                timeToMarket: remix.estimatedTimeToMarket,
                projectedRevenue: remix.potentialRevenue,
              },
            }),
          ),
        );
      }

      return {
        remixes: object.remixes,
        count: object.remixes.length,
      };
    } catch (error) {
      console.error("Failed to remix business model:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remix business model. Please try again.",
      });
    }
  });
