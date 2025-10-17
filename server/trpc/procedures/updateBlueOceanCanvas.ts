import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateBlueOceanCanvas = baseProcedure
  .input(
    z.object({
      token: z.string(),
      canvasId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      eliminate: z.array(z.string()).optional(),
      reduce: z.array(z.string()).optional(),
      raise: z.array(z.string()).optional(),
      create: z.array(z.string()).optional(),
      actionPlan: z.array(z.any()).optional(),
      timeline: z.any().optional(),
      status: z.enum(["draft", "in_progress", "completed"]).optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    const canvas = await db.blueOceanCanvas.findUnique({
      where: { id: input.canvasId },
    });

    if (!canvas) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Canvas not found",
      });
    }

    if (canvas.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this canvas",
      });
    }

    const updateData: any = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.eliminate) updateData.eliminate = JSON.stringify(input.eliminate);
    if (input.reduce) updateData.reduce = JSON.stringify(input.reduce);
    if (input.raise) updateData.raise = JSON.stringify(input.raise);
    if (input.create) updateData.create = JSON.stringify(input.create);
    if (input.actionPlan) updateData.actionPlan = JSON.stringify(input.actionPlan);
    if (input.timeline) updateData.timeline = JSON.stringify(input.timeline);
    if (input.status) updateData.status = input.status;

    const updatedCanvas = await db.blueOceanCanvas.update({
      where: { id: input.canvasId },
      data: updateData,
    });

    return updatedCanvas;
  });
