/**
 * Application monitoring and metrics utilities
 */

import { logger } from "./logger";

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn(`Slow operation detected: ${metric.name}`, {
        duration: metric.duration,
        ...metric.metadata,
      });
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get percentile duration for an operation
   */
  getPercentileDuration(name: string, percentile: number): number {
    const metrics = this.getMetrics(name)
      .map((m) => m.duration)
      .sort((a, b) => a - b);

    if (metrics.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * metrics.length) - 1;
    return metrics[index] ?? 0;
  }

  /**
   * Get success rate for an operation
   */
  getSuccessRate(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const successful = metrics.filter((m) => m.success).length;
    return (successful / metrics.length) * 100;
  }

  /**
   * Get all metrics summary
   */
  getSummary(): Record<
    string,
    {
      count: number;
      avgDuration: number;
      p50: number;
      p95: number;
      p99: number;
      successRate: number;
    }
  > {
    const operations = [...new Set(this.metrics.map((m) => m.name))];

    return operations.reduce(
      (acc, name) => {
        acc[name] = {
          count: this.getMetrics(name).length,
          avgDuration: Math.round(this.getAverageDuration(name)),
          p50: Math.round(this.getPercentileDuration(name, 50)),
          p95: Math.round(this.getPercentileDuration(name, 95)),
          p99: Math.round(this.getPercentileDuration(name, 99)),
          successRate: Math.round(this.getSuccessRate(name)),
        };
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

export const metrics = new MetricsCollector();

/**
 * Track performance of an async operation
 */
export async function trackPerformance<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>,
): Promise<T> {
  const startTime = performance.now();
  let success = true;

  try {
    const result = await operation();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;

    metrics.record({
      name,
      duration,
      timestamp: new Date(),
      success,
      metadata,
    });
  }
}

/**
 * Track performance of a sync operation
 */
export function trackPerformanceSync<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, any>,
): T {
  const startTime = performance.now();
  let success = true;

  try {
    const result = operation();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;

    metrics.record({
      name,
      duration,
      timestamp: new Date(),
      success,
      metadata,
    });
  }
}

/**
 * Get current system health metrics
 */
export function getSystemHealth() {
  const memUsage = process.memoryUsage();

  return {
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      heapUsedPercent: Math.round(
        (memUsage.heapUsed / memUsage.heapTotal) * 100,
      ),
    },
    performance: metrics.getSummary(),
  };
}

/**
 * Middleware to track tRPC procedure performance
 */
export function createPerformanceMiddleware() {
  return async (opts: {
    path: string;
    type: string;
    next: () => Promise<any>;
  }) => {
    const startTime = performance.now();
    let success = true;

    try {
      const result = await opts.next();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;

      metrics.record({
        name: `${opts.type}.${opts.path}`,
        duration,
        timestamp: new Date(),
        success,
        metadata: {
          type: opts.type,
          path: opts.path,
        },
      });

      logger.performance(`${opts.type}.${opts.path}`, duration, {
        success,
      });
    }
  };
}
