import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createBreadcrumb = baseProcedure
  .input(
    z.object({
      token: z.string(),
      content: z.string().min(1),
      context: z.string().optional(),
      tags: z.array(z.string()).optional(),
      marketId: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const breadcrumb = await db.insightBreadcrumb.create({
      data: {
        userId: user.id,
        content: input.content,
        context: input.context,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        marketId: input.marketId,
      },
    });
    
    return breadcrumb;
  });
