import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const simulateScenario = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      name: z.string().optional(),
      // Market assumptions
      marketSize: z.number().optional(),
      marketGrowth: z.number().optional(),
      competitorCount: z.number().optional(),
      // Business model assumptions
      pricing: z.number().optional(),
      costStructure: z.number().optional(),
      timeToMarket: z.number().optional(),
      // Additional simulation parameters
      customerAcquisitionCost: z.number().optional(),
      conversionRate: z.number().optional(),
      churnRate: z.number().optional(),
    }),
  )
  .query(async ({ input }) => {
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

    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI service not configured",
      });
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const { object } = await generateObject({
        model,
        schema: z.object({
          projectedRevenue: z.number().describe("Projected first-year revenue in millions"),
          projectedMarketShare: z.number().describe("Projected market share percentage"),
          projectedROI: z.number().describe("Projected return on investment percentage"),
          breakEvenMonths: z.number().describe("Months to break even"),
          yearOneCustomers: z.number().describe("Estimated customers in year one"),
          customerLifetimeValue: z.number().describe("Average customer lifetime value"),
          paybackPeriod: z.number().describe("Customer acquisition payback period in months"),
          riskFactors: z.array(z.string()).describe("Key risk factors"),
          opportunityFactors: z.array(z.string()).describe("Key opportunity factors"),
          sensitivityAnalysis: z.object({
            pricingImpact: z.string().describe("Impact of 10% pricing change"),
            marketSizeImpact: z.string().describe("Impact of 20% market size change"),
            competitionImpact: z.string().describe("Impact of increased competition"),
          }),
        }),
        prompt: `You are a financial modeling expert. Analyze this business scenario and provide instant projections:

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Market: ${opportunity.segment.market.name}
Sector: ${opportunity.segment.market.sector}

CURRENT SIMULATION PARAMETERS:
- Market Size (TAM): ${input.marketSize ? `$${input.marketSize}M` : "Not specified"}
- Market Growth Rate: ${input.marketGrowth ? `${input.marketGrowth}%/year` : "Not specified"}
- Number of Competitors: ${input.competitorCount ?? "Not specified"}
- Pricing: ${input.pricing ? `$${input.pricing}` : "Not specified"}
- Cost Structure: ${input.costStructure ? `${input.costStructure}% of revenue` : "Not specified"}
- Time to Market: ${input.timeToMarket ? `${input.timeToMarket} months` : "Not specified"}
- Customer Acquisition Cost: ${input.customerAcquisitionCost ? `$${input.customerAcquisitionCost}` : "Not specified"}
- Conversion Rate: ${input.conversionRate ? `${input.conversionRate}%` : "Not specified"}
- Churn Rate: ${input.churnRate ? `${input.churnRate}%/year` : "Not specified"}

Provide realistic, data-driven projections. Focus on Blue Ocean principles - value innovation creates new demand rather than competing for existing customers. Include sensitivity analysis to show how changes in key variables affect outcomes.`,
      });

      return {
        simulation: {
          name: input.name || "Simulation",
          ...object,
          assumptions: {
            marketSize: input.marketSize,
            marketGrowth: input.marketGrowth,
            competitorCount: input.competitorCount,
            pricing: input.pricing,
            costStructure: input.costStructure,
            timeToMarket: input.timeToMarket,
            customerAcquisitionCost: input.customerAcquisitionCost,
            conversionRate: input.conversionRate,
            churnRate: input.churnRate,
          },
        },
      };
    } catch (error) {
      console.error("Failed to simulate scenario:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to simulate scenario. Please try again.",
      });
    }
  });
