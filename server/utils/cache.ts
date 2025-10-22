import { env } from '../env';
import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      tags: options.tags || [],
    };

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
    logger.debug('Cache set', { key, ttl, tags: options.tags });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.data as T;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    logger.debug('Cache invalidated by tag', { tag, count });
    return count;
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
    }
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Redis cache implementation (if Redis is available)
class RedisCache {
  private client: any; // Redis client would be initialized here
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 300) {
    this.defaultTTL = defaultTTL;
    // Initialize Redis client if REDIS_URL is provided
    if (env.REDIS_URL) {
      // this.client = new Redis(env.REDIS_URL);
    }
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    if (!this.client) return;

    const ttl = options.ttl || this.defaultTTL;
    const value = JSON.stringify({
      data,
      timestamp: Date.now(),
      tags: options.tags || [],
    });

    try {
      await this.client.setex(key, ttl, value);
      logger.debug('Redis cache set', { key, ttl, tags: options.tags });
    } catch (error) {
      logger.error('Redis cache set failed', { key, error });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const value = await this.client.get(key);
      if (!value) {
        logger.debug('Redis cache miss', { key });
        return null;
      }

      const parsed = JSON.parse(value);
      logger.debug('Redis cache hit', { key });
      return parsed.data as T;
    } catch (error) {
      logger.error('Redis cache get failed', { key, error });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.del(key);
      logger.debug('Redis cache deleted', { key });
      return result > 0;
    } catch (error) {
      logger.error('Redis cache delete failed', { key, error });
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.client) return 0;

    try {
      // This would require a more sophisticated implementation
      // with Redis sets to track keys by tags
      logger.debug('Redis cache invalidated by tag', { tag });
      return 0;
    } catch (error) {
      logger.error('Redis cache invalidation failed', { tag, error });
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.flushdb();
      logger.debug('Redis cache cleared');
    } catch (error) {
      logger.error('Redis cache clear failed', { error });
    }
  }
}

// Cache factory
function createCache() {
  if (env.REDIS_URL && env.NODE_ENV === 'production') {
    return new RedisCache();
  }
  return new MemoryCache();
}

export const cache = createCache();

/**
 * Cache decorator for methods
 */
export function cached(keyPrefix: string, options: CacheOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const argsHash = JSON.stringify(args);
      const cacheKey = `${keyPrefix}:${propertyKey}:${argsHash}`;

      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cache.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
}

/**
 * Query result caching middleware for tRPC
 */
export function createCacheMiddleware(keyPrefix: string, options: CacheOptions = {}) {
  return async (opts: any) => {
    const { path, input, type } = opts;

    // Only cache queries, not mutations
    if (type !== 'query') {
      return opts.next();
    }

    // Generate cache key
    const inputHash = JSON.stringify(input || {});
    const cacheKey = `${keyPrefix}:${path}:${inputHash}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await opts.next();

    // Cache successful results
    if (result.ok) {
      await cache.set(cacheKey, result, options);
    }

    return result;
  };
}

/**
 * Database query result caching
 */
export class QueryCache {
  private static instance: QueryCache;

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }

  async cacheQuery<T>(
    query: string,
    params: any[],
    executor: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cacheKey = `query:${query}:${JSON.stringify(params)}`;
    
    // Try cache first
    const cached = await cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await executor();

    // Cache result
    await cache.set(cacheKey, result, { ttl });

    return result;
  }

  invalidatePattern(pattern: string): void {
    // This would require a more sophisticated pattern matching
    // For now, we'll use tags for invalidation
    cache.invalidateByTag(pattern);
  }
}

export const queryCache = QueryCache.getInstance();