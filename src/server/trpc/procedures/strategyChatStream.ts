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
    
    // Build system prompt
    const systemPrompt = `You are a strategic business advisor and Blue Ocean strategy expert. You help entrepreneurs and business leaders discover and validate new market opportunities.

User Profile:
${preferences ? `- Values: ${JSON.parse(preferences.values).join(", ")}
- Energy Level: ${preferences.energyLevel}
- Work Style: ${preferences.workStyle}
- Risk Tolerance: ${preferences.riskTolerance}` : "- No preferences set"}

Your role:
1. Ask insightful questions to understand their goals and constraints
2. Analyze opportunities for strategic fit and personal alignment
3. Challenge assumptions and play devil's advocate when needed
4. Provide actionable next steps and validation strategies
5. Be honest about risks and potential pitfalls

Be conversational, insightful, and direct. Think like a combination of a strategic consultant and a trusted mentor.

${opportunityContext ? `\nCurrent Opportunity Context:\n${opportunityContext}` : ""}`;
    
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
