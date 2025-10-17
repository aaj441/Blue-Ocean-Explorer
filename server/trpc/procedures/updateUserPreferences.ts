import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateUserPreferences = baseProcedure
  .input(
    z.object({
      token: z.string(),
      values: z.array(z.string()).optional(),
      energyLevel: z.enum(["high", "balanced", "low"]).optional(),
      workStyle: z.enum(["solo", "collaborative", "hybrid"]).optional(),
      riskTolerance: z.enum(["low", "medium", "high"]).optional(),
      industryFocus: z.array(z.string()).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    const updateData: any = {};
    
    if (input.values !== undefined) {
      updateData.values = JSON.stringify(input.values);
    }
    if (input.energyLevel !== undefined) {
      updateData.energyLevel = input.energyLevel;
    }
    if (input.workStyle !== undefined) {
      updateData.workStyle = input.workStyle;
    }
    if (input.riskTolerance !== undefined) {
      updateData.riskTolerance = input.riskTolerance;
    }
    if (input.industryFocus !== undefined) {
      updateData.industryFocus = JSON.stringify(input.industryFocus);
    }
    
    const preferences = await db.userPreferences.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        values: JSON.stringify(input.values || ["innovation", "impact", "growth"]),
        energyLevel: input.energyLevel || "balanced",
        workStyle: input.workStyle || "collaborative",
        riskTolerance: input.riskTolerance || "medium",
        industryFocus: input.industryFocus ? JSON.stringify(input.industryFocus) : null,
      },
    });
    
    return {
      ...preferences,
      values: JSON.parse(preferences.values),
      industryFocus: preferences.industryFocus ? JSON.parse(preferences.industryFocus) : null,
    };
  });
