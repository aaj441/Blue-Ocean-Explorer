import { defineEventHandler, sendError, createError } from '@tanstack/react-start/server';
import { createClient } from 'redis';
import { env } from '~/server/env';
import { logger } from '~/server/utils/logger';
import { RateLimitError } from '~/server/utils/errors';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (event: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private redis: ReturnType<typeof createClient> | null = null;
  private inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    if (env.REDIS_URL) {
      try {
        this.redis = createClient({ url: env.REDIS_URL });
        await this.redis.connect();
        logger.info('Redis connected for rate limiting');
      } catch (error) {
        logger.error('Failed to connect to Redis, falling back to in-memory store', { error });
        this.redis = null;
      }
    }
  }

  async limit(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + options.windowMs;

    if (this.redis) {
      return this.limitWithRedis(key, options, now, resetTime);
    } else {
      return this.limitInMemory(key, options, now, resetTime);
    }
  }

  private async limitWithRedis(
    key: string,
    options: RateLimitOptions,
    now: number,
    resetTime: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redisKey = `rate_limit:${key}`;
    
    try {
      // Use Redis transaction for atomic operations
      const multi = this.redis!.multi();
      multi.incr(redisKey);
      multi.expire(redisKey, Math.ceil(options.windowMs / 1000));
      
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 1;
      
      const allowed = count <= options.maxRequests;
      const remaining = Math.max(0, options.maxRequests - count);
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      logger.error('Redis rate limit error', { error, key });
      // Fallback to allow request on Redis error
      return { allowed: true, remaining: options.maxRequests, resetTime };
    }
  }

  private limitInMemory(
    key: string,
    options: RateLimitOptions,
    now: number,
    resetTime: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    // Clean up expired entries
    if (this.inMemoryStore.size > 10000) {
      this.cleanupExpiredEntries(now);
    }

    const entry = this.inMemoryStore.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // New window
      this.inMemoryStore.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetTime,
      };
    }

    // Increment count
    entry.count++;
    const allowed = entry.count <= options.maxRequests;
    const remaining = Math.max(0, options.maxRequests - entry.count);
    
    return { allowed, remaining, resetTime: entry.resetTime };
  }

  private cleanupExpiredEntries(now: number) {
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.resetTime <= now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

export function createRateLimitMiddleware(options?: Partial<RateLimitOptions>) {
  const config: RateLimitOptions = {
    windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
    maxRequests: Number(env.RATE_LIMIT_MAX_REQUESTS),
    keyGenerator: (event) => {
      // Use IP address as default key
      const forwarded = event.node.req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0] : event.node.req.socket.remoteAddress;
      return ip || 'unknown';
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    ...options,
  };

  return defineEventHandler(async (event) => {
    // Skip rate limiting for certain paths
    const path = event.node.req.url || '';
    if (path.startsWith('/health') || path.startsWith('/metrics')) {
      return;
    }

    const key = config.keyGenerator!(event);
    const result = await rateLimiter.limit(key, config);

    // Set rate limit headers
    event.node.res.setHeader('X-RateLimit-Limit', config.maxRequests);
    event.node.res.setHeader('X-RateLimit-Remaining', result.remaining);
    event.node.res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      event.node.res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
      
      logger.warn('Rate limit exceeded', {
        key,
        path,
        method: event.node.req.method,
      });

      return sendError(event, createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        data: {
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetTime,
        },
      }));
    }
  });
}

// Specific rate limiters for different endpoints
export const apiRateLimiter = createRateLimitMiddleware();

export const authRateLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
  keyGenerator: (event) => {
    // Use a combination of IP and attempted email for auth endpoints
    const body = event.node.req.body;
    const email = body?.email || '';
    const forwarded = event.node.req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : event.node.req.socket.remoteAddress;
    return `auth:${ip}:${email}`;
  },
});

export const aiRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 AI requests per minute
  keyGenerator: (event) => {
    // Use user ID if authenticated
    const userId = event.context.userId;
    if (userId) {
      return `ai:user:${userId}`;
    }
    // Fall back to IP
    const forwarded = event.node.req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : event.node.req.socket.remoteAddress;
    return `ai:ip:${ip}`;
  },
});