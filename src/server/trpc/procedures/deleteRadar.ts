import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const deleteRadar = baseProcedure
  .input(
    z.object({
      token: z.string(),
      radarId: z.number(),
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
    
    await db.radar.delete({
      where: { id: input.radarId },
    });
    
    return { success: true };
  });
