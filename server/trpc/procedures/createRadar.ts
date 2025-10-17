import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createRadar = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      criteria: z.object({
        industries: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        maxCompetitors: z.number().optional(),
        minTAM: z.number().optional(),
        maxEntryBarrier: z.enum(["low", "medium", "high"]).optional(),
      }),
      alertFrequency: z.enum(["realtime", "daily", "weekly"]).default("weekly"),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const radar = await db.radar.create({
      data: {
        userId: user.id,
        name: input.name,
        description: input.description,
        criteria: JSON.stringify(input.criteria),
        alertFrequency: input.alertFrequency,
      },
    });
    
    return radar;
  });
