import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { publicProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { loginSchema } from "~/server/utils/validation";
import { logger } from "~/server/utils/logger";
import { AuthenticationError } from "~/server/utils/errors";
import { sanitizeString, getClientIP } from "~/server/utils/security";

export const login = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input, ctx }) => {
    const { email, password, rememberMe } = input;
    const clientIP = getClientIP(ctx.req);
    
    // Sanitize input
    const sanitizedEmail = sanitizeString(email.toLowerCase());
    
    // Find user
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true, // Updated field name to match schema
        name: true,
        avatar: true,
        subscriptionTier: true,
        creditBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      logger.security('Failed login attempt - user not found', clientIP, ctx.req?.headers?.['user-agent'], 'low');
      throw new AuthenticationError("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      logger.security('Failed login attempt - invalid password', clientIP, ctx.req?.headers?.['user-agent'], 'medium');
      throw new AuthenticationError("Invalid email or password");
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { 
        updatedAt: new Date() // Using updatedAt instead of lastLogin to match schema
      },
    });

    // Generate JWT token
    const expiresIn = rememberMe ? "30d" : "7d";
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      }, 
      env.JWT_SECRET, 
      { expiresIn }
    );

    // Log successful login
    logger.auth('User logged in', user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        subscriptionTier: user.subscriptionTier,
        creditBalance: user.creditBalance,
        createdAt: user.createdAt,
      },
      token,
      expiresIn,
    };
  });
