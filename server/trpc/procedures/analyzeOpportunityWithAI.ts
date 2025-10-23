import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const analyzeOpportunityWithAI = baseProcedure
  .input(
    z.object({
      token: z.string(),
      opportunityId: z.number(),
      analysisType: z.enum([
        "blue_ocean_assessment",
        "competitive_analysis", 
        "market_validation",
        "risk_assessment",
        "value_innovation",
        "business_model_review"
      ]),
      customPrompt: z.string().optional(),
    }),
  )
  .query(async function* ({ input }) {
    const user = await authenticateUser(input.token);
    
    // Fetch opportunity with full context
    const opportunity = await db.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        segment: {
          include: {
            market: {
              include: {
                competitors: true,
                trends: true,
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

    // Get user preferences for context
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });

    // Build context for AI analysis
    const context = {
      opportunity: {
        title: opportunity.title,
        description: opportunity.description,
        status: opportunity.status,
        score: opportunity.score,
        revenue: opportunity.revenue,
        risk: opportunity.risk,
        strategicFit: opportunity.strategicFit,
        entryBarrier: opportunity.entryBarrier,
      },
      market: {
        name: opportunity.segment.market.name,
        sector: opportunity.segment.market.sector,
        description: opportunity.segment.market.description,
      },
      segment: {
        name: opportunity.segment.name,
        characteristics: opportunity.segment.characteristics,
        size: opportunity.segment.size,
        growth: opportunity.segment.growth,
      },
      competitors: opportunity.segment.market.competitors.map(c => ({
        name: c.name,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        positioning: c.positioning,
        marketShare: c.marketShare,
      })),
      trends: opportunity.segment.market.trends.map(t => ({
        title: t.title,
        sentimentScore: t.sentimentScore,
        source: t.source,
      })),
      userProfile: preferences ? {
        values: JSON.parse(preferences.values),
        energyLevel: preferences.energyLevel,
        workStyle: preferences.workStyle,
        riskTolerance: preferences.riskTolerance,
      } : null,
    };

    // Build analysis-specific prompts
    const analysisPrompts = {
      blue_ocean_assessment: `Analyze this opportunity through the Blue Ocean Strategy lens. Apply the Four Actions Framework (Eliminate, Reduce, Raise, Create) and assess potential for value innovation. Consider the Six Paths Framework and identify noncustomers. Provide a strategy canvas recommendation.`,
      
      competitive_analysis: `Conduct a comprehensive competitive analysis. Identify direct and indirect competitors, analyze their value propositions, strengths, and weaknesses. Assess competitive positioning and identify gaps in the market.`,
      
      market_validation: `Validate this market opportunity. Assess market size, growth potential, customer demand, and market readiness. Identify validation strategies and key metrics to track.`,
      
      risk_assessment: `Perform a thorough risk assessment. Identify strategic, operational, financial, and market risks. Assess risk probability and impact. Provide mitigation strategies.`,
      
      value_innovation: `Explore value innovation opportunities. Identify factors the industry takes for granted that could be eliminated or reduced, and factors that could be raised or created. Focus on creating new value for customers.`,
      
      business_model_review: `Review and suggest improvements to the business model. Analyze revenue streams, cost structure, key partnerships, and value proposition. Identify potential pivots or enhancements.`,
    };

    const basePrompt = analysisPrompts[input.analysisType];
    const customPrompt = input.customPrompt ? `\n\nAdditional context: ${input.customPrompt}` : "";

    const systemPrompt = `You are Xavier, an elite strategic advisor specializing in Blue Ocean Strategy and market innovation. You have 20+ years of experience helping companies create uncontested market spaces.

## Analysis Context:
${JSON.stringify(context, null, 2)}

## Analysis Request:
${basePrompt}${customPrompt}

## Your Response Should Include:
1. **Executive Summary**: Key insights and recommendations
2. **Detailed Analysis**: Deep dive into the specific analysis type
3. **Strategic Recommendations**: Actionable next steps
4. **Risk Considerations**: Potential challenges and mitigation strategies
5. **Success Metrics**: How to measure progress and success
6. **Timeline**: Suggested implementation phases

Be specific, data-driven, and actionable. Use frameworks and methodologies where appropriate.`;

    // Set up AI streaming
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const model = openrouter("openai/gpt-4o");

    const { textStream } = streamText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please analyze this opportunity using the ${input.analysisType.replace('_', ' ')} approach.`,
        },
      ],
    });

    // Stream the response
    let fullResponse = "";
    for await (const textPart of textStream) {
      fullResponse += textPart;
      yield { chunk: textPart, done: false };
    }

    // Save analysis to database
    await db.opportunityAnalysis.create({
      data: {
        opportunityId: input.opportunityId,
        analysisType: input.analysisType,
        content: fullResponse,
        userId: user.id,
      },
    });

    yield { chunk: "", done: true };
  });