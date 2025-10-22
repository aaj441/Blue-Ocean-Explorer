import { defineEventHandler } from '@tanstack/react-start/server';
import { db } from '~/server/db';
import { checkDatabaseHealth } from '~/server/utils/database';
import { cache } from '~/server/utils/cache';
import { performance } from '~/server/utils/performance';
import { env } from '~/server/env';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: env.NODE_ENV,
  };

  // Basic health check (always returns 200)
  if (event.node.req.url === '/health') {
    return checks;
  }

  // Detailed health check for /health/live
  if (event.node.req.url === '/health/live') {
    try {
      // Check database
      const dbHealthy = await checkDatabaseHealth(db);
      checks.database = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
      };

      // Check Redis cache
      const cacheStartTime = Date.now();
      try {
        await cache.set('health-check', true, { ttl: 10 });
        const cached = await cache.get('health-check');
        checks.cache = {
          status: cached === true ? 'healthy' : 'degraded',
          latency: Date.now() - cacheStartTime,
        };
      } catch (error) {
        checks.cache = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Overall status
      const allHealthy = 
        checks.database?.status === 'healthy' && 
        checks.cache?.status === 'healthy';
      
      checks.status = allHealthy ? 'healthy' : 'degraded';
      
      return {
        ...checks,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        ...checks,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime,
      };
    }
  }

  // Readiness check for /health/ready
  if (event.node.req.url === '/health/ready') {
    try {
      // More comprehensive checks
      const dbHealthy = await checkDatabaseHealth(db);
      
      if (!dbHealthy) {
        event.node.res.statusCode = 503;
        return {
          status: 'not ready',
          reason: 'Database connection not established',
        };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      event.node.res.statusCode = 503;
      return {
        status: 'not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Default response
  return checks;
});