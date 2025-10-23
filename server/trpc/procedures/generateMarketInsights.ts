import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const generateMarketInsights = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
      insightType: z.enum([
        "trend_analysis",
        "opportunity_identification", 
        "competitive_intelligence",
        "customer_insights",
        "market_forecasting",
        "blue_ocean_opportunities"
      ]),
      focusAreas: z.array(z.string()).optional(),
      timeframe: z.enum(["short_term", "medium_term", "long_term"]).optional(),
    }),
  )
  .query(async function* ({ input }) {
    const user = await authenticateUser(input.token);
    
    // Fetch market with full context
    const market = await db.market.findUnique({
      where: { id: input.marketId },
      include: {
        segments: {
          include: {
            opportunities: true,
          },
        },
        competitors: true,
        trends: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        user: {
          select: {
            preferences: true,
          },
        },
      },
    });

    if (!market) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Market not found",
      });
    }

    if (market.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this market",
      });
    }

    // Build comprehensive context
    const context = {
      market: {
        name: market.name,
        sector: market.sector,
        description: market.description,
        createdAt: market.createdAt,
      },
      segments: market.segments.map(s => ({
        name: s.name,
        characteristics: s.characteristics,
        size: s.size,
        growth: s.growth,
        opportunityCount: s.opportunities.length,
        opportunities: s.opportunities.map(o => ({
          title: o.title,
          status: o.status,
          score: o.score,
          revenue: o.revenue,
          risk: o.risk,
        })),
      })),
      competitors: market.competitors.map(c => ({
        name: c.name,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        positioning: c.positioning,
        marketShare: c.marketShare,
      })),
      trends: market.trends.map(t => ({
        title: t.title,
        sentimentScore: t.sentimentScore,
        source: t.source,
        createdAt: t.createdAt,
      })),
      userPreferences: market.user?.preferences ? {
        values: JSON.parse(market.user.preferences.values),
        energyLevel: market.user.preferences.energyLevel,
        workStyle: market.user.preferences.workStyle,
        riskTolerance: market.user.preferences.riskTolerance,
      } : null,
      analysisParameters: {
        insightType: input.insightType,
        focusAreas: input.focusAreas || [],
        timeframe: input.timeframe || "medium_term",
      },
    };

    // Build insight-specific system prompts
    const insightPrompts = {
      trend_analysis: `Analyze market trends and their implications. Identify emerging patterns, sentiment shifts, and trend convergence opportunities. Focus on actionable insights for strategic positioning.`,
      
      opportunity_identification: `Identify new market opportunities using Blue Ocean principles. Look for underserved segments, emerging needs, and value innovation possibilities. Apply the Six Paths Framework.`,
      
      competitive_intelligence: `Analyze competitive landscape and positioning. Identify competitive gaps, market share opportunities, and strategic positioning advantages.`,
      
      customer_insights: `Generate deep customer insights and personas. Identify unmet needs, pain points, and value drivers. Focus on noncustomers and market creation opportunities.`,
      
      market_forecasting: `Provide market forecasting and future scenario analysis. Predict market evolution, potential disruptions, and strategic implications.`,
      
      blue_ocean_opportunities: `Apply Blue Ocean Strategy frameworks to identify uncontested market spaces. Use Four Actions Framework, Strategy Canvas, and Three Tiers of Noncustomers.`,
    };

    const basePrompt = insightPrompts[input.insightType];
    const timeframeContext = {
      short_term: "Focus on immediate opportunities and quick wins (3-12 months)",
      medium_term: "Focus on strategic initiatives and market positioning (1-3 years)", 
      long_term: "Focus on transformational opportunities and market creation (3+ years)",
    };

    const systemPrompt = `You are Xavier, an elite market strategist and Blue Ocean expert with deep expertise in market analysis, competitive intelligence, and strategic innovation.

## Market Context:
${JSON.stringify(context, null, 2)}

## Analysis Request:
${basePrompt}

## Timeframe Focus:
${timeframeContext[input.timeframe || "medium_term"]}

## Your Analysis Should Include:

### 1. Executive Summary
- Key findings and strategic implications
- Priority recommendations
- Risk and opportunity assessment

### 2. Detailed Analysis
- Deep dive into the specific insight type
- Data-driven insights with supporting evidence
- Framework application (Blue Ocean, Porter's Five Forces, etc.)

### 3. Strategic Recommendations
- Specific, actionable next steps
- Implementation priorities
- Success metrics and KPIs

### 4. Market Opportunities
- New opportunity identification
- Value innovation possibilities
- Market creation strategies

### 5. Risk Assessment
- Potential challenges and threats
- Mitigation strategies
- Contingency planning

### 6. Implementation Roadmap
- Phased approach with timelines
- Resource requirements
- Key milestones and checkpoints

Be specific, strategic, and actionable. Use data to support recommendations and provide clear implementation guidance.`;

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
          content: `Generate comprehensive ${input.insightType.replace('_', ' ')} insights for this market.`,
        },
      ],
    });

    // Stream the response
    let fullResponse = "";
    for await (const textPart of textStream) {
      fullResponse += textPart;
      yield { chunk: textPart, done: false };
    }

    // Save insights to database
    await db.marketInsight.create({
      data: {
        marketId: input.marketId,
        insightType: input.insightType,
        content: fullResponse,
        focusAreas: input.focusAreas || [],
        timeframe: input.timeframe || "medium_term",
        userId: user.id,
      },
    });

    yield { chunk: "", done: true };
  });