import { PrismaClient } from '@prisma/client';
import { env } from '~/server/env';
import { logger } from './logger';
import { performance } from './performance';

// Extend PrismaClient with logging and performance monitoring
export function createPrismaClient() {
  const prisma = new PrismaClient({
    log: env.NODE_ENV === 'development' 
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ]
      : [{ level: 'error', emit: 'event' }],
  });

  // Log queries in development
  if (env.NODE_ENV === 'development') {
    // @ts-ignore
    prisma.$on('query', async (e) => {
      logger.logQuery(e.query, e.duration, {
        params: e.params,
        target: e.target,
      });
    });
  }

  // Always log errors
  // @ts-ignore
  prisma.$on('error', async (e) => {
    logger.error('Database error', {
      error: e,
      target: e.target,
    });
  });

  // Always log warnings
  // @ts-ignore
  prisma.$on('warn', async (e) => {
    logger.warn('Database warning', {
      message: e.message,
      target: e.target,
    });
  });

  // Add middleware for performance monitoring
  prisma.$use(async (params, next) => {
    const operation = `${params.model}.${params.action}`;
    
    return performance.measure(`db.${operation}`, () => next(params), {
      model: params.model,
      action: params.action,
    });
  });

  return prisma;
}

// Database connection health check
export async function checkDatabaseHealth(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

// Transaction helper with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes('unique constraint') ||
         error.message.includes('foreign key constraint'))
      ) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`Database operation failed, retrying (${attempt}/${maxRetries})`, {
          error,
          attempt,
        });
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

// Batch operation helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the database
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Database optimization tips
export const dbOptimizations = {
  // Use select to only fetch needed fields
  selectMinimal: <T extends Record<string, any>>(fields: (keyof T)[]) => {
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<keyof T, true>);
  },
  
  // Common includes for reducing N+1 queries
  includeUser: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
  },
  
  includeMarket: {
    market: {
      select: {
        id: true,
        name: true,
        industry: true,
      },
    },
  },
  
  // Pagination helper
  paginate: (page: number = 1, limit: number = 20) => ({
    skip: (page - 1) * limit,
    take: limit,
  }),
  
  // Sorting helper
  orderBy: (field: string, direction: 'asc' | 'desc' = 'desc') => ({
    [field]: direction,
  }),
};