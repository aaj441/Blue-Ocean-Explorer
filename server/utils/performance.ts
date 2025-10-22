import { logger } from './logger';
import { env } from '~/server/env';

interface PerformanceMetric {
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  warning: number;
  critical: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: Map<string, PerformanceThresholds> = new Map();

  private constructor() {
    this.setupDefaultThresholds();
    this.startPeriodicReporting();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupDefaultThresholds() {
    // Database query thresholds
    this.thresholds.set('db.query', { warning: 100, critical: 500 });
    this.thresholds.set('db.transaction', { warning: 500, critical: 2000 });
    
    // API call thresholds
    this.thresholds.set('api.external', { warning: 1000, critical: 5000 });
    this.thresholds.set('api.ai', { warning: 2000, critical: 10000 });
    
    // Request processing thresholds
    this.thresholds.set('request.trpc', { warning: 200, critical: 1000 });
    this.thresholds.set('request.http', { warning: 100, critical: 500 });
    
    // File operations
    this.thresholds.set('file.read', { warning: 50, critical: 200 });
    this.thresholds.set('file.write', { warning: 100, critical: 500 });
    
    // Cache operations
    this.thresholds.set('cache.read', { warning: 10, critical: 50 });
    this.thresholds.set('cache.write', { warning: 20, critical: 100 });
  }

  private startPeriodicReporting() {
    if (env.NODE_ENV === 'production') {
      // Report metrics every 5 minutes
      setInterval(() => {
        this.reportMetrics();
      }, 5 * 60 * 1000);
    }
  }

  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let error: Error | undefined;
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: error?.message });
      this.checkThresholds(name, duration);
    }
  }

  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    let error: Error | undefined;
    
    try {
      const result = operation();
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: error?.message });
      this.checkThresholds(name, duration);
    }
  }

  private recordMetric(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = { name, duration, metadata };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);
    
    // Keep only last 1000 metrics per name
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  private checkThresholds(name: string, duration: number) {
    const threshold = this.thresholds.get(name);
    if (!threshold) return;
    
    if (duration >= threshold.critical) {
      logger.error(`Performance critical: ${name} took ${duration.toFixed(2)}ms`, {
        metric: name,
        duration,
        threshold: threshold.critical,
      });
    } else if (duration >= threshold.warning) {
      logger.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`, {
        metric: name,
        duration,
        threshold: threshold.warning,
      });
    }
  }

  getMetrics(name?: string): Record<string, any> {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      return this.calculateStats(metrics);
    }
    
    const allStats: Record<string, any> = {};
    for (const [metricName, metrics] of this.metrics.entries()) {
      allStats[metricName] = this.calculateStats(metrics);
    }
    
    return allStats;
  }

  private calculateStats(metrics: PerformanceMetric[]): Record<string, any> {
    if (metrics.length === 0) {
      return { count: 0 };
    }
    
    const durations = metrics.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  private reportMetrics() {
    const stats = this.getMetrics();
    
    logger.info('Performance metrics report', {
      metrics: stats,
      timestamp: new Date().toISOString(),
    });
    
    // Clear old metrics after reporting
    this.metrics.clear();
  }

  // Helper method to create a timer
  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      this.checkThresholds(name, duration);
    };
  }
}

export const performance = PerformanceMonitor.getInstance();

// Decorators for class methods
export function Timed(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      return performance.measure(name, () => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

// Express-like middleware for timing routes
export function timingMiddleware(req: any, res: any, next: any) {
  const timer = performance.startTimer('request.http');
  
  res.on('finish', () => {
    timer({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
  });
  
  next();
}