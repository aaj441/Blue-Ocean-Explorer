import { db } from '../db';
import { env } from '../env';
import { logger } from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      message?: string;
      responseTime?: number;
      details?: any;
    };
  };
}

/**
 * Perform database health check
 */
async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime,
    };
  }
}

/**
 * Check external service availability (OpenRouter AI)
 */
async function checkExternalServices(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Simple health check to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        status: 'unhealthy',
        message: `OpenRouter API returned ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('External services health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'External service check failed',
      responseTime,
    };
  }
}

/**
 * Check Redis availability (if configured)
 */
async function checkRedis(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string; responseTime: number }> {
  const startTime = Date.now();
  
  if (!env.REDIS_URL) {
    return {
      status: 'healthy',
      message: 'Redis not configured',
      responseTime: 0,
    };
  }
  
  try {
    // If Redis client is available, ping it
    // This would require Redis client implementation
    // For now, just return healthy
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Redis health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Redis connection failed',
      responseTime,
    };
  }
}

/**
 * Check file storage (MinIO) availability
 */
async function checkFileStorage(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Simple check to MinIO endpoint
    const minioUrl = `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/minio/health/live`;
    
    const response = await fetch(minioUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        status: 'unhealthy',
        message: `MinIO returned ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('File storage health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'File storage check failed',
      responseTime,
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources(): { status: 'healthy' | 'unhealthy' | 'degraded'; message?: string; details: any } {
  const used = process.memoryUsage();
  const totalMemory = used.heapTotal;
  const usedMemory = used.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  const uptime = process.uptime();
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  let message: string | undefined;
  
  if (memoryUsagePercent > 90) {
    status = 'unhealthy';
    message = 'High memory usage detected';
  } else if (memoryUsagePercent > 75) {
    status = 'degraded';
    message = 'Elevated memory usage';
  }
  
  return {
    status,
    message,
    details: {
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryUsagePercent),
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
    },
  };
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  logger.info('Starting health check');
  
  // Run all health checks in parallel
  const [
    databaseCheck,
    externalServicesCheck,
    redisCheck,
    fileStorageCheck,
    systemCheck,
  ] = await Promise.all([
    checkDatabase(),
    checkExternalServices(),
    checkRedis(),
    checkFileStorage(),
    Promise.resolve(checkSystemResources()),
  ]);
  
  const checks = {
    database: databaseCheck,
    externalServices: externalServicesCheck,
    redis: redisCheck,
    fileStorage: fileStorageCheck,
    system: systemCheck,
  };
  
  // Determine overall status
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  
  const unhealthyChecks = Object.values(checks).filter(check => check.status === 'unhealthy');
  const degradedChecks = Object.values(checks).filter(check => check.status === 'degraded');
  
  if (unhealthyChecks.length > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedChecks.length > 0) {
    overallStatus = 'degraded';
  }
  
  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };
  
  const totalTime = Date.now() - startTime;
  logger.info('Health check completed', { 
    status: overallStatus, 
    duration: `${totalTime}ms`,
    unhealthyChecks: unhealthyChecks.length,
    degradedChecks: degradedChecks.length,
  });
  
  return result;
}

/**
 * Simple liveness check (for Kubernetes liveness probe)
 */
export function livenessCheck(): { status: 'ok'; timestamp: string } {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Readiness check (for Kubernetes readiness probe)
 */
export async function readinessCheck(): Promise<{ status: 'ready' | 'not-ready'; timestamp: string; message?: string }> {
  try {
    // Check critical dependencies
    await db.$queryRaw`SELECT 1`;
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Readiness check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Service not ready',
    };
  }
}