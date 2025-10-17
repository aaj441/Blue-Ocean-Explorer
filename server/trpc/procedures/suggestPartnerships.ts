import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const suggestPartnerships = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      opportunityId: z.number().optional(),
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

    if (input.opportunityId) {
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
    } else if (input.marketId) {
      const market = await db.market.findUnique({
        where: { id: input.marketId },
        include: {
          competitors: true,
          segments: true,
        },
      });

      if (!market || market.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this market",
        });
      }

      contextData = {
        market: market.name,
        sector: market.sector,
        description: market.description,
      };
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either marketId or opportunityId is required",
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
          partnerships: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              partnerType: z.enum(["cross_industry", "complementary", "ecosystem", "platform"]),
              suggestedPartner: z.string(),
              partnerIndustry: z.string(),
              synergies: z.array(z.string()),
              dataCompatibility: z.object({
                yourCapabilities: z.array(z.string()),
                partnerCapabilities: z.array(z.string()),
                sharedValue: z.string(),
              }),
              valueCreation: z.string(),
              implementationPath: z.array(z.string()),
              confidenceScore: z.number().min(0).max(1),
            }),
          ),
        }),
        prompt: `You are a strategic partnership expert specializing in identifying cross-industry collaboration opportunities.

Analyze this context and suggest 3-5 strategic partnerships:

${contextData.opportunity ? `Opportunity: ${contextData.opportunity}\nDescription: ${contextData.description}\n` : ""}
Market: ${contextData.market}
Sector: ${contextData.sector}

Suggest partnerships that:
1. Are from DIFFERENT industries (cross-industry innovation)
2. Have DATA or CAPABILITY COMPATIBILITY (not just overlap)
3. Create NEW VALUE rather than competing
4. Form ecosystems or platforms, not just bilateral deals

Partnership Types:
- CROSS-INDUSTRY: Partners from unrelated industries with complementary capabilities
- COMPLEMENTARY: Partners that fill gaps in your value chain
- ECOSYSTEM: Multi-party networks creating shared platforms
- PLATFORM: Partners that help you become a platform or join theirs

For each partnership:
1. Name a specific type of partner (can be generic like "Data Analytics Platform" or specific company)
2. Explain what capabilities each brings
3. Describe how data/capabilities are COMPATIBLE (not redundant)
4. Show how partnership creates NEW market value
5. Provide concrete implementation steps
6. Assess confidence in partnership potential

Think Blue Ocean - partnerships that open new market spaces, not partnerships that fight for existing markets.`,
      });

      // Create partnerships in database
      const createdPartnerships = await Promise.all(
        object.partnerships.map((partnership) =>
          db.partnership.create({
            data: {
              userId: user.id,
              name: partnership.name,
              description: partnership.description,
              partnerType: partnership.partnerType,
              suggestedPartner: partnership.suggestedPartner,
              partnerIndustry: partnership.partnerIndustry,
              synergies: JSON.stringify(partnership.synergies),
              dataCompatibility: JSON.stringify(partnership.dataCompatibility),
              valueCreation: partnership.valueCreation,
              implementationPath: JSON.stringify(partnership.implementationPath),
              confidenceScore: partnership.confidenceScore,
            },
          }),
        ),
      );

      return {
        partnerships: createdPartnerships,
        count: createdPartnerships.length,
      };
    } catch (error) {
      console.error("Failed to suggest partnerships:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to suggest partnerships. Please try again.",
      });
    }
  });
