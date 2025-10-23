import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "~/server/env";

export const predictValueMigration = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number().optional(),
      industries: z.array(z.string()).optional(),
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

    if (input.marketId) {
      const market = await db.market.findUnique({
        where: { id: input.marketId },
        include: {
          trends: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          competitors: true,
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
        trends: market.trends,
        competitors: market.competitors.length,
      };
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const model = openrouter("openai/gpt-4o");

      const { object } = await generateObject({
        model,
        schema: z.object({
          migrations: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              fromIndustry: z.string(),
              toIndustry: z.string(),
              migrationDrivers: z.array(
                z.object({
                  type: z.enum(["technological", "regulatory", "economic", "social", "environmental"]),
                  description: z.string(),
                }),
              ),
              timeline: z.enum(["short_term", "medium_term", "long_term"]),
              confidence: z.number().min(0).max(1),
              impactAssessment: z.string(),
              opportunityWindow: z.string(),
              predictedMarketSize: z.number(),
              actionableSteps: z.array(z.string()),
            }),
          ),
        }),
        prompt: `You are a strategic foresight expert specializing in value migration analysis - predicting where economic value shifts from one industry to another.

${contextData.market ? `Context:
Market: ${contextData.market}
Sector: ${contextData.sector}
Recent Trends: ${contextData.trends?.slice(0, 5).map((t: any) => t.title).join(", ")}
` : ""}

${input.industries && input.industries.length > 0 ? `Focus on these industries: ${input.industries.join(", ")}` : "Analyze current major industry shifts"}

Predict value migration patterns by analyzing:
- Technological disruptions (AI, blockchain, quantum, biotech, etc.)
- Regulatory changes (data privacy, climate, trade, etc.)
- Economic shifts (remote work, gig economy, sustainability)
- Social changes (demographics, values, behaviors)
- Environmental pressures (climate, resources, sustainability)

For each migration:
1. Identify the source industry losing value
2. Identify the destination industry gaining value
3. Explain the drivers causing the shift
4. Assess timeline (short: 1-2 years, medium: 3-5 years, long: 5+ years)
5. Provide confidence score
6. Describe the opportunity window for first movers
7. Estimate the market size of the new space
8. List concrete action steps to capitalize

Focus on PREEMPTIVE opportunities - blue oceans that are forming but not yet obvious to competitors.`,
      });

      // Create value migrations in database
      const createdMigrations = await Promise.all(
        object.migrations.map((migration) =>
          db.valueMigration.create({
            data: {
              name: migration.name,
              description: migration.description,
              fromIndustry: migration.fromIndustry,
              toIndustry: migration.toIndustry,
              migrationDrivers: JSON.stringify(migration.migrationDrivers),
              timeline: migration.timeline,
              confidence: migration.confidence,
              impactAssessment: migration.impactAssessment,
              opportunityWindow: migration.opportunityWindow,
              predictedMarketSize: migration.predictedMarketSize,
            },
          }),
        ),
      );

      return {
        migrations: createdMigrations,
        count: createdMigrations.length,
      };
    } catch (error) {
      console.error("Failed to predict value migration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to predict value migration. Please try again.",
      });
    }
  });
