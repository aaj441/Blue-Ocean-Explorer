import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { logger, Timer } from "../utils/logger";
import { toTRPCError, logError } from "../utils/errors";
import { createRateLimitMiddleware, getClientIP } from "../utils/security";
import { authenticateUser } from "../utils/auth";

// Create context type
export interface Context {
  req?: any;
  res?: any;
  user?: any;
  requestId?: string;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: {
      reconnectAfterInactivityMs: 5000,
    },
    ping: {
      enabled: true,
      intervalMs: 2500,
    },
  },
  errorFormatter({ shape, error }) {
    // Log the error
    logError(error, { 
      code: shape.code, 
      path: shape.data?.path,
      httpStatus: shape.data?.httpStatus 
    });

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Middleware for logging and performance monitoring
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const timer = new Timer(`${type}:${path}`);
  const requestId = ctx.requestId || 'unknown';
  
  logger.info(`tRPC ${type} started`, { 
    path, 
    requestId,
    ip: ctx.req ? getClientIP(ctx.req) : undefined 
  });

  try {
    const result = await next();
    const duration = timer.end();
    
    logger.info(`tRPC ${type} completed`, { 
      path, 
      requestId, 
      duration: `${duration}ms`,
      success: true 
    });
    
    return result;
  } catch (error) {
    const duration = timer.end();
    
    logger.error(`tRPC ${type} failed`, { 
      path, 
      requestId, 
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    throw toTRPCError(error);
  }
});

// Rate limiting middleware
const rateLimitMiddleware = createRateLimitMiddleware((ctx: Context) => {
  // Use IP address for anonymous users, user ID for authenticated users
  return ctx.user?.id || getClientIP(ctx.req) || 'anonymous';
});

// Authentication middleware
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  // Extract token from various sources
  const token = 
    ctx.req?.headers?.authorization?.replace('Bearer ', '') ||
    ctx.req?.cookies?.token ||
    ctx.req?.query?.token;

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication token required',
    });
  }

  try {
    const user = await authenticateUser(token);
    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
});

// Optional authentication middleware (doesn't throw if no token)
const optionalAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  const token = 
    ctx.req?.headers?.authorization?.replace('Bearer ', '') ||
    ctx.req?.cookies?.token ||
    ctx.req?.query?.token;

  let user = null;
  if (token) {
    try {
      user = await authenticateUser(token);
    } catch (error) {
      // Ignore authentication errors for optional auth
      logger.debug('Optional auth failed', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Base procedures with different middleware combinations
export const baseProcedure = t.procedure
  .use(loggingMiddleware);

export const publicProcedure = baseProcedure
  .use(rateLimitMiddleware)
  .use(optionalAuthMiddleware);

export const protectedProcedure = baseProcedure
  .use(rateLimitMiddleware)
  .use(authMiddleware);

// Admin-only procedure
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user?.role || ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    return next();
  });
