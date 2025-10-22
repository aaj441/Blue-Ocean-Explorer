import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { logger } from "~/server/utils/logger";
import { sanitizeEmail, truncateString } from "~/server/utils/sanitize";

export const register = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
      name: z.string().min(1, "Name is required").max(255, "Name too long"),
      role: z.enum(["analyst", "strategist", "executive"]).default("analyst"),
    }),
  )
  .mutation(async ({ input }) => {
    const sanitizedEmail = sanitizeEmail(input.email);
    const sanitizedName = truncateString(input.name.trim(), 255);

    logger.info("Registration attempt", { email: sanitizedEmail });

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      logger.security("Registration failed - email already exists", { 
        email: sanitizedEmail 
      });
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        role: input.role,
      },
    });

    logger.audit("User registered", user.id, { 
      email: sanitizedEmail,
      role: input.role 
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  });
