import { logger } from './logger';
import { env } from '../env';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface ErrorMetric {
  error: Error;
  context?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly maxErrors = 500;

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance metric
    logger.performance(name, value, unit);

    // Send to external monitoring service if configured
    this.sendToExternalService(metric);
  }

  /**
   * Record an error
   */
  recordError(error: Error, context?: Record<string, any>, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const errorMetric: ErrorMetric = {
      error,
      context,
      timestamp: new Date(),
      severity,
    };

    this.errors.push(errorMetric);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error
    logger.error(`${severity.toUpperCase()}: ${error.message}`, {
      stack: error.stack,
      context,
      severity,
    });

    // Send to external error tracking service
    this.sendErrorToExternalService(errorMetric);
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(timeWindow: number = 300000): Record<string, any> { // 5 minutes default
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const summary: Record<string, any> = {};

    // Group metrics by name
    const groupedMetrics = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);

      summary[name] = {
        count,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: sum / count,
        p50: sorted[Math.floor(count * 0.5)],
        p95: sorted[Math.floor(count * 0.95)],
        p99: sorted[Math.floor(count * 0.99)],
      };
    });

    return summary;
  }

  /**
   * Get error summary
   */
  getErrorSummary(timeWindow: number = 300000): Record<string, any> {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff);

    const errorCounts = recentErrors.reduce((acc, error) => {
      const key = error.error.name || 'UnknownError';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recentErrors.length,
      byType: errorCounts,
      bySeverity: severityCounts,
    };
  }

  /**
   * Get system health metrics
   */
  getSystemMetrics(): Record<string, any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  /**
   * Send metric to external monitoring service
   */
  private sendToExternalService(metric: PerformanceMetric) {
    // Implementation would depend on your monitoring service
    // Examples: DataDog, New Relic, Prometheus, etc.
    
    if (env.NODE_ENV === 'production') {
      // Example for DataDog
      // datadog.increment('app.metric', 1, metric.tags);
      // datadog.histogram('app.performance', metric.value, metric.tags);
    }
  }

  /**
   * Send error to external error tracking service
   */
  private sendErrorToExternalService(errorMetric: ErrorMetric) {
    // Implementation would depend on your error tracking service
    // Examples: Sentry, Bugsnag, Rollbar, etc.
    
    if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
      // Example for Sentry
      // Sentry.captureException(errorMetric.error, {
      //   extra: errorMetric.context,
      //   level: errorMetric.severity,
      // });
    }
  }

  /**
   * Start periodic system metrics collection
   */
  startSystemMetricsCollection(intervalMs: number = 60000) { // 1 minute default
    setInterval(() => {
      const systemMetrics = this.getSystemMetrics();
      
      this.recordMetric('system.memory.heap_used', systemMetrics.memory.heapUsed, 'MB');
      this.recordMetric('system.memory.heap_used_percent', systemMetrics.memory.heapUsedPercent, '%');
      this.recordMetric('system.uptime', systemMetrics.uptime, 's');
      
      // Alert on high memory usage
      if (systemMetrics.memory.heapUsedPercent > 85) {
        this.recordError(
          new Error(`High memory usage: ${systemMetrics.memory.heapUsedPercent}%`),
          { systemMetrics },
          systemMetrics.memory.heapUsedPercent > 95 ? 'critical' : 'high'
        );
      }
    }, intervalMs);
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

/**
 * Decorator for measuring function execution time
 */
export function measureTime(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        monitoring.recordMetric(metricName, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        monitoring.recordMetric(metricName, duration, 'ms', { status: 'error' });
        monitoring.recordError(error as Error, { method: metricName, args });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Express middleware for request monitoring
 */
export function requestMonitoringMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const route = req.route?.path || req.path || 'unknown';
      
      monitoring.recordMetric('http.request.duration', duration, 'ms', {
        method: req.method,
        route,
        status: res.statusCode.toString(),
      });

      monitoring.recordMetric('http.request.count', 1, 'count', {
        method: req.method,
        route,
        status: res.statusCode.toString(),
      });

      // Record errors for 4xx and 5xx responses
      if (res.statusCode >= 400) {
        monitoring.recordError(
          new Error(`HTTP ${res.statusCode}: ${req.method} ${route}`),
          {
            method: req.method,
            route,
            statusCode: res.statusCode,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
          },
          res.statusCode >= 500 ? 'high' : 'medium'
        );
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Database query monitoring
 */
export function monitorDatabaseQuery(operation: string, table?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        monitoring.recordMetric('db.query.duration', duration, 'ms', {
          operation,
          table: table || 'unknown',
        });
        
        monitoring.recordMetric('db.query.count', 1, 'count', {
          operation,
          table: table || 'unknown',
          status: 'success',
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        monitoring.recordMetric('db.query.duration', duration, 'ms', {
          operation,
          table: table || 'unknown',
          status: 'error',
        });
        
        monitoring.recordMetric('db.query.count', 1, 'count', {
          operation,
          table: table || 'unknown',
          status: 'error',
        });
        
        monitoring.recordError(error as Error, {
          operation,
          table,
          query: propertyKey,
        });
        
        throw error;
      }
    };

    return descriptor;
  };
}

// Start system metrics collection
if (env.NODE_ENV === 'production') {
  monitoring.startSystemMetricsCollection();
}