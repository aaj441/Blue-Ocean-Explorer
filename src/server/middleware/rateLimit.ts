import { TRPCError } from "@trpc/server";
import { logger } from "../utils/logger";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key]!.resetTime < now) {
        delete this.store[key];
      }
    });
  }

  check(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60 * 1000,
  ): void {
    const now = Date.now();
    const key = identifier;

    if (!this.store[key] || this.store[key]!.resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return;
    }

    const entry = this.store[key]!;
    entry.count++;

    if (entry.count > limit) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      logger.security("Rate limit exceeded", {
        identifier,
        count: entry.count,
        limit,
        resetIn,
      });

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests. Please try again in ${resetIn} seconds.`,
      });
    }
  }

  reset(identifier: string): void {
    delete this.store[identifier];
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

export const rateLimiter = new RateLimiter();

// Middleware factory for tRPC procedures
export function createRateLimitMiddleware(
  limit: number = 100,
  windowMs: number = 60 * 1000,
) {
  return async (opts: { input: any; ctx?: any; next: () => any }) => {
    // Extract identifier from context (IP, user ID, etc.)
    const identifier =
      opts.ctx?.ip || opts.ctx?.userId?.toString() || "anonymous";

    rateLimiter.check(identifier, limit, windowMs);

    return opts.next();
  };
}

// Specific rate limiters for different operations
export const authRateLimiter = createRateLimitMiddleware(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const apiRateLimiter = createRateLimitMiddleware(100, 60 * 1000); // 100 requests per minute
export const aiRateLimiter = createRateLimitMiddleware(20, 60 * 1000); // 20 AI requests per minute
