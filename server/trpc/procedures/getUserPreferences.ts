import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getUserPreferences = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const user = await authenticateUser(input.token);
    
    let preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    
    if (!preferences) {
      preferences = await db.userPreferences.create({
        data: {
          userId: user.id,
          values: JSON.stringify(["innovation", "impact", "growth"]),
          energyLevel: "balanced",
          workStyle: "collaborative",
          riskTolerance: "medium",
        },
      });
    }
    
    return {
      ...preferences,
      values: JSON.parse(preferences.values),
      industryFocus: preferences.industryFocus ? JSON.parse(preferences.industryFocus) : null,
    };
  });
