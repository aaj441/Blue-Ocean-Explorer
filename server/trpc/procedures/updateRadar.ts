import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateRadar = baseProcedure
  .input(
    z.object({
      token: z.string(),
      radarId: z.number(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      criteria: z.object({
        industries: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        maxCompetitors: z.number().optional(),
        minTAM: z.number().optional(),
        maxEntryBarrier: z.enum(["low", "medium", "high"]).optional(),
      }).optional(),
      alertFrequency: z.enum(["realtime", "daily", "weekly"]).optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const radar = await db.radar.findUnique({
      where: { id: input.radarId },
    });
    
    if (!radar) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Radar not found",
      });
    }
    
    if (radar.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this radar",
      });
    }
    
    const updatedRadar = await db.radar.update({
      where: { id: input.radarId },
      data: {
        name: input.name,
        description: input.description,
        criteria: input.criteria ? JSON.stringify(input.criteria) : undefined,
        alertFrequency: input.alertFrequency,
        isActive: input.isActive,
      },
    });
    
    return updatedRadar;
  });
