import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { logger } from "~/server/utils/logger";
import { toTRPCError } from "~/server/utils/errors";
import { env } from "~/server/env";

export interface Context {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  requestId: string;
  startTime: number;
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
  errorFormatter({ shape, error, ctx }) {
    const isZodError = error.cause instanceof ZodError;
    const isDevelopment = env.NODE_ENV === "development";
    
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: isZodError ? error.cause.flatten() : null,
        // Include stack trace in development
        stack: isDevelopment && error.stack ? error.stack : undefined,
        // Include request context
        requestId: ctx?.requestId,
      },
    };
  },
});

// Middleware to check authentication
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now guaranteed to be defined
    },
  });
});

// Middleware to check roles
const hasRole = (roles: string[]) => {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to access this resource",
      });
    }
    
    return next({ ctx });
  });
};

// Middleware for rate limiting (implemented at the HTTP level)
const rateLimited = t.middleware(({ ctx, next }) => {
  // Rate limiting is handled by HTTP middleware
  // This is just a placeholder for procedure-specific limits
  return next({ ctx });
});

// Middleware for logging
const logged = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  
  const result = await next();
  
  const duration = Date.now() - start;
  
  if (result.ok) {
    logger.debug(`tRPC ${type} completed`, {
      path,
      duration,
      userId: ctx.user?.id,
      requestId: ctx.requestId,
    });
  }
  
  return result;
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Base procedures
export const baseProcedure = t.procedure.use(logged);
export const protectedProcedure = t.procedure.use(logged).use(isAuthenticated);
export const adminProcedure = t.procedure.use(logged).use(hasRole(["ADMIN"]));
export const aiProcedure = t.procedure.use(logged).use(isAuthenticated).use(rateLimited);
