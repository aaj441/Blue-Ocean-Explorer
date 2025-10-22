import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { logger } from "~/server/utils/logger";
import { sanitizeEmail } from "~/server/utils/sanitize";

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const sanitizedEmail = sanitizeEmail(input.email);

    logger.info("Login attempt", { email: sanitizedEmail });

    // Find user
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      logger.security("Login failed - user not found", { email: sanitizedEmail });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      logger.security("Login failed - invalid password", { 
        email: sanitizedEmail,
        userId: user.id 
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "30d",
    });

    logger.audit("User logged in", user.id, { email: sanitizedEmail });

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
