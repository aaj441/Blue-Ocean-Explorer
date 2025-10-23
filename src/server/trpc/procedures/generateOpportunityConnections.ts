import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";
import { streamObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const generateOpportunityConnections = baseProcedure
  .input(
    z.object({
      token: z.string(),
      marketId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    // Get market with all opportunities
    const market = await db.market.findUnique({
      where: { id: input.marketId },
      include: {
        segments: {
          include: {
            opportunities: true,
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
    
    const allOpportunities = market.segments.flatMap(s => s.opportunities);
    
    if (allOpportunities.length < 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Need at least 2 opportunities to generate connections",
      });
    }
    
    // Use AI to generate connections
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    const model = openrouter("openai/gpt-4o");
    
    const opportunitiesText = allOpportunities.map((opp, i) => 
      `${i + 1}. ID ${opp.id}: ${opp.title} - ${opp.description}`
    ).join('\n\n');
    
    const { object } = await streamObject({
      model,
      output: "array",
      schema: z.object({
        sourceId: z.number(),
        targetId: z.number(),
        connectionType: z.enum(["similar_market", "complementary", "competitive", "cross_pollination"]),
        strength: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
      prompt: `Analyze these business opportunities and identify meaningful connections between them:

${opportunitiesText}

For each pair of opportunities that have a significant relationship, create a connection with:
- sourceId and targetId (the opportunity IDs)
- connectionType: 
  * "similar_market" - they target similar customer segments or markets
  * "complementary" - they could work together or enhance each other
  * "competitive" - they compete for the same resources or customers
  * "cross_pollination" - insights from one could inspire innovation in the other
- strength: 0-1 indicating how strong the connection is
- reasoning: brief explanation of the connection

Focus on non-obvious connections that reveal patterns. Don't create connections for every pair - only where there's real insight.`,
    });
    
    const connections = await object;
    
    // Store connections in database
    const createdConnections = [];
    for (const conn of connections) {
      // Verify both opportunities exist
      const sourceExists = allOpportunities.find(o => o.id === conn.sourceId);
      const targetExists = allOpportunities.find(o => o.id === conn.targetId);
      
      if (sourceExists && targetExists && conn.sourceId !== conn.targetId) {
        try {
          const created = await db.opportunityConnection.create({
            data: {
              sourceOpportunityId: conn.sourceId,
              targetOpportunityId: conn.targetId,
              connectionType: conn.connectionType,
              strength: conn.strength,
              reasoning: conn.reasoning,
            },
          });
          createdConnections.push(created);
        } catch (error) {
          // Connection might already exist, skip
          console.error('Error creating connection:', error);
        }
      }
    }
    
    return {
      connectionsCreated: createdConnections.length,
      connections: createdConnections,
    };
  });
