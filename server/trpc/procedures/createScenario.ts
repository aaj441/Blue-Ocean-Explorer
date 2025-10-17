import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const createScenario = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      marketSize: z.number().optional(),
      marketGrowth: z.number().optional(),
      competitorCount: z.number().optional(),
      pricing: z.number().optional(),
      costStructure: z.number().optional(),
      timeToMarket: z.number().optional(),
      generateProjections: z.boolean().default(true),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify opportunity exists and user has access
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

    let projectedRevenue: number | undefined;
    let projectedMarketShare: number | undefined;
    let projectedROI: number | undefined;
    let riskAssessment: string | undefined;
    let keyAssumptions: string | undefined;

    // Generate AI projections if requested
    if (input.generateProjections && process.env.OPENROUTER_API_KEY) {
      try {
        const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });

        const model = openrouter("openai/gpt-4o");

        const { object } = await generateObject({
          model,
          schema: z.object({
            projectedRevenue: z.number().describe("Projected first-year revenue in millions"),
            projectedMarketShare: z.number().describe("Projected market share percentage"),
            projectedROI: z.number().describe("Projected return on investment percentage"),
            riskAssessment: z.string().describe("Detailed risk assessment and potential challenges"),
            keyAssumptions: z.array(z.string()).describe("List of 3-5 key assumptions this scenario depends on"),
          }),
          prompt: `Analyze this business scenario and provide projections:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Market: ${opportunity.segment.market.name}
Sector: ${opportunity.segment.market.sector}

Scenario: ${input.name}
${input.description ? `Description: ${input.description}` : ""}

Assumptions:
- Market Size (TAM): ${input.marketSize ? `$${input.marketSize}M` : "Not specified"}
- Market Growth Rate: ${input.marketGrowth ? `${input.marketGrowth}%` : "Not specified"}
- Number of Competitors: ${input.competitorCount ?? "Not specified"}
- Pricing: ${input.pricing ? `$${input.pricing}` : "Not specified"}
- Cost Structure: ${input.costStructure ? `${input.costStructure}% of revenue` : "Not specified"}
- Time to Market: ${input.timeToMarket ? `${input.timeToMarket} months` : "Not specified"}

Provide realistic projections based on these assumptions. Consider Blue Ocean strategy principles - focus on value innovation and market creation rather than competition.`,
        });

        projectedRevenue = object.projectedRevenue;
        projectedMarketShare = object.projectedMarketShare;
        projectedROI = object.projectedROI;
        riskAssessment = object.riskAssessment;
        keyAssumptions = JSON.stringify(object.keyAssumptions);
      } catch (error) {
        console.error("Failed to generate AI projections:", error);
        // Continue without AI projections
      }
    }

    const scenario = await db.scenario.create({
      data: {
        opportunityId: input.opportunityId,
        name: input.name,
        description: input.description,
        marketSize: input.marketSize,
        marketGrowth: input.marketGrowth,
        competitorCount: input.competitorCount,
        pricing: input.pricing,
        costStructure: input.costStructure,
        timeToMarket: input.timeToMarket,
        projectedRevenue,
        projectedMarketShare,
        projectedROI,
        riskAssessment,
        keyAssumptions,
      },
    });

    return scenario;
  });
