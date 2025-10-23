import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createMarketplaceListing = baseProcedure
  .input(
    z.object({
      token: z.string(),
      type: z.enum(["scenario_template", "analytic_template", "expert_report"]),
      itemId: z.number(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      price: z.number().min(0),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      previewUrl: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Verify the item exists and belongs to the user
    if (input.type === "scenario_template") {
      const scenario = await db.scenario.findUnique({
        where: { id: input.itemId },
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
    }

    const listing = await db.marketplaceListing.create({
      data: {
        sellerId: user.id,
        type: input.type,
        itemId: input.itemId,
        title: input.title,
        description: input.description,
        price: input.price,
        category: input.category,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        previewUrl: input.previewUrl,
      },
    });

    return { listing };
  });
