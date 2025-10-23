import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const strategyChatStream = baseProcedure
  .input(
    z.object({
      token: z.string(),
      sessionId: z.number(),
      message: z.string(),
      opportunityIds: z.array(z.number()).optional(),
    }),
  )
  .query(async function* ({ input }) {
    const user = await authenticateUser(input.token);
    
    // Fetch session
    const session = await db.strategySession.findUnique({
      where: { id: input.sessionId },
    });
    
    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Strategy session not found",
      });
    }
    
    if (session.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this session",
      });
    }
    
    // Get user preferences for context
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    
    // Parse existing messages
    const existingMessages = JSON.parse(session.messages);
    
    // Fetch opportunity context if provided
    let opportunityContext = "";
    if (input.opportunityIds && input.opportunityIds.length > 0) {
      const opportunities = await db.opportunity.findMany({
        where: {
          id: { in: input.opportunityIds },
          segment: {
            market: {
              userId: user.id,
            },
          },
        },
        include: {
          segment: {
            include: {
              market: true,
            },
          },
          insight: true,
        },
      });
      
      opportunityContext = opportunities
        .map(
          (opp) =>
            `Opportunity: ${opp.title}\nMarket: ${opp.segment.market.name}\nDescription: ${opp.description}\nRisk: ${opp.risk}\nScore: ${opp.score}${opp.insight ? `\nAlignment Score: ${opp.insight.alignmentScore}` : ""}`,
        )
        .join("\n\n");
    }
    
    // Build enhanced system prompt
    const systemPrompt = `You are Xavier, an elite strategic business advisor and Blue Ocean strategy expert with 20+ years of experience helping Fortune 500 companies and startups discover uncontested market spaces. You combine the analytical rigor of McKinsey with the creative disruption of Clayton Christensen and the market-making insights of W. Chan Kim.

## Your Expertise:
- Blue Ocean Strategy framework and value innovation
- Market creation and disruption theory
- Competitive analysis and positioning
- Business model innovation
- Strategic planning and execution
- Risk assessment and mitigation
- Team dynamics and organizational change

## User Profile:
${preferences ? `- Values: ${JSON.parse(preferences.values).join(", ")}
- Energy Level: ${preferences.energyLevel}
- Work Style: ${preferences.workStyle}
- Risk Tolerance: ${preferences.riskTolerance}` : "- No preferences set"}

## Your Approach:
1. **Strategic Discovery**: Ask penetrating questions that reveal hidden assumptions and uncover blind spots
2. **Market Analysis**: Apply Blue Ocean principles to identify value innovation opportunities
3. **Reality Check**: Challenge ideas with data-driven insights and real-world constraints
4. **Actionable Intelligence**: Provide specific, measurable next steps with clear success metrics
5. **Risk Management**: Identify potential pitfalls and mitigation strategies upfront
6. **Personal Alignment**: Ensure opportunities match the user's values, energy, and risk profile

## Communication Style:
- Conversational yet authoritative
- Data-driven but not dry
- Challenging but supportive
- Direct but empathetic
- Strategic but practical

## Key Frameworks to Apply:
- Four Actions Framework (Eliminate, Reduce, Raise, Create)
- Strategy Canvas and Value Curve
- Six Paths Framework
- Three Tiers of Noncustomers
- Blue Ocean Idea Index
- Pioneer-Migrator-Settler Map

${opportunityContext ? `\n## Current Opportunity Context:\n${opportunityContext}` : ""}

Remember: Your goal is to help them create uncontested market space and make competition irrelevant. Be the strategic partner they wish they had.`;
    
    // Add user message to history
    const messages = [
      ...existingMessages,
      { role: "user", content: input.message },
    ];
    
    // Set up AI streaming
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    const model = openrouter("openai/gpt-4o");
    
    const { textStream } = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });
    
    // Stream the response
    let fullResponse = "";
    for await (const textPart of textStream) {
      fullResponse += textPart;
      yield { chunk: textPart, done: false };
    }
    
    // Update session with complete conversation
    const updatedMessages = [
      ...messages,
      { role: "assistant", content: fullResponse },
    ];
    
    await db.strategySession.update({
      where: { id: input.sessionId },
      data: {
        messages: JSON.stringify(updatedMessages),
        context: input.opportunityIds
          ? JSON.stringify(input.opportunityIds)
          : session.context,
        updatedAt: new Date(),
      },
    });
    
    yield { chunk: "", done: true };
  });
