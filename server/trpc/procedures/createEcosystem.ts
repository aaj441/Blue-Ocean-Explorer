import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const createEcosystem = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(3, "Name must be at least 3 characters"),
      description: z.string().optional(),
      vision: z.string().optional(),
      isPublic: z.boolean().default(false),
    }),
  )
  .mutation(async ({ input }) => {
    const user = await authenticateUser(input.token);

    // Create ecosystem
    const ecosystem = await db.ecosystem.create({
      data: {
        name: input.name,
        description: input.description,
        vision: input.vision,
        ownerId: user.id,
        isPublic: input.isPublic,
      },
    });

    // Add creator as first member with owner role
    await db.ecosystemMember.create({
      data: {
        ecosystemId: ecosystem.id,
        userId: user.id,
        role: "owner",
      },
    });

    return ecosystem;
  });
