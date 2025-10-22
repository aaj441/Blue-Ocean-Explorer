import { createClient, RedisClientType } from 'redis';
import { env } from '~/server/env';
import { logger } from './logger';
import { performance } from './performance';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for invalidation
}

class CacheManager {
  private static instance: CacheManager;
  private redis: RedisClientType | null = null;
  private inMemoryCache: Map<string, { value: any; expires: number }> = new Map();
  private taggedKeys: Map<string, Set<string>> = new Map();

  private constructor() {
    this.initRedis();
    this.startCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async initRedis() {
    if (env.REDIS_URL) {
      try {
        this.redis = createClient({ url: env.REDIS_URL });
        await this.redis.connect();
        logger.info('Redis cache connected');
        
        // Set up error handling
        this.redis.on('error', (err) => {
          logger.error('Redis cache error', { error: err });
        });
      } catch (error) {
        logger.error('Failed to connect to Redis cache', { error });
        this.redis = null;
      }
    }
  }

  private startCleanupInterval() {
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000);
  }

  private cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.expires <= now) {
        this.inMemoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return performance.measure('cache.read', async () => {
      // Try Redis first
      if (this.redis) {
        try {
          const value = await this.redis.get(key);
          if (value) {
            logger.logCache('hit', key, { source: 'redis' });
            return JSON.parse(value);
          }
        } catch (error) {
          logger.error('Redis cache get error', { error, key });
        }
      }
      
      // Fall back to in-memory cache
      const entry = this.inMemoryCache.get(key);
      if (entry && entry.expires > Date.now()) {
        logger.logCache('hit', key, { source: 'memory' });
        return entry.value;
      }
      
      logger.logCache('miss', key);
      return null;
    });
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    return performance.measure('cache.write', async () => {
      const ttl = options.ttl || 3600; // Default 1 hour
      const expires = Date.now() + (ttl * 1000);
      
      // Store in Redis
      if (this.redis) {
        try {
          await this.redis.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
          logger.error('Redis cache set error', { error, key });
        }
      }
      
      // Store in memory cache
      this.inMemoryCache.set(key, { value, expires });
      
      // Handle tags
      if (options.tags) {
        for (const tag of options.tags) {
          if (!this.taggedKeys.has(tag)) {
            this.taggedKeys.set(tag, new Set());
          }
          this.taggedKeys.get(tag)!.add(key);
        }
      }
      
      logger.logCache('set', key, { ttl, tags: options.tags });
    });
  }

  async delete(key: string): Promise<void> {
    // Delete from Redis
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        logger.error('Redis cache delete error', { error, key });
      }
    }
    
    // Delete from memory cache
    this.inMemoryCache.delete(key);
    
    // Remove from tagged keys
    for (const [tag, keys] of this.taggedKeys.entries()) {
      keys.delete(key);
    }
    
    logger.logCache('delete', key);
  }

  async invalidateTag(tag: string): Promise<void> {
    const keys = this.taggedKeys.get(tag);
    if (!keys) return;
    
    const promises: Promise<void>[] = [];
    for (const key of keys) {
      promises.push(this.delete(key));
    }
    
    await Promise.all(promises);
    this.taggedKeys.delete(tag);
    
    logger.info(`Invalidated ${keys.size} cache entries with tag: ${tag}`);
  }

  async flush(): Promise<void> {
    // Flush Redis
    if (this.redis) {
      try {
        await this.redis.flushAll();
      } catch (error) {
        logger.error('Redis cache flush error', { error });
      }
    }
    
    // Clear memory cache
    this.inMemoryCache.clear();
    this.taggedKeys.clear();
    
    logger.info('Cache flushed');
  }

  // Decorator for caching method results
  static cacheable(keyPrefix: string, ttl: number = 3600, tags?: string[]) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      const cache = CacheManager.getInstance();
      
      descriptor.value = async function (...args: any[]) {
        // Generate cache key from method name and arguments
        const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        // Execute method and cache result
        const result = await originalMethod.apply(this, args);
        await cache.set(cacheKey, result, { ttl, tags });
        
        return result;
      };
      
      return descriptor;
    };
  }

  // Helper to create cache keys
  static createKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}

export const cache = CacheManager.getInstance();

// Cache key generators
export const cacheKeys = {
  user: (id: number) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  market: (id: number) => `market:${id}`,
  markets: (userId?: number) => userId ? `markets:user:${userId}` : 'markets:all',
  opportunity: (id: number) => `opportunity:${id}`,
  opportunities: (filters?: any) => `opportunities:${JSON.stringify(filters || {})}`,
  board: (id: number) => `board:${id}`,
  boards: (userId: number) => `boards:user:${userId}`,
  creditBalance: (userId: number) => `credits:${userId}`,
  subscription: (userId: number) => `subscription:${userId}`,
};