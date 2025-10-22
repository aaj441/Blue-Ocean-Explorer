import { defineEventHandler } from '@tanstack/react-start/server';
import { performance } from '~/server/utils/performance';
import { env } from '~/server/env';
import { logger } from '~/server/utils/logger';

export default defineEventHandler(async (event) => {
  // Only allow in development or with proper authentication
  if (env.NODE_ENV === 'production') {
    // Check for metrics authorization token
    const authHeader = event.node.req.headers.authorization;
    const metricsToken = process.env.METRICS_AUTH_TOKEN;
    
    if (!metricsToken || authHeader !== `Bearer ${metricsToken}`) {
      event.node.res.statusCode = 401;
      return { error: 'Unauthorized' };
    }
  }

  // Get all performance metrics
  const performanceMetrics = performance.getMetrics();
  
  // Get system metrics
  const systemMetrics = {
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
      arrayBuffers: process.memoryUsage().arrayBuffers,
    },
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    version: {
      node: process.version,
      app: process.env.npm_package_version || 'unknown',
    },
  };

  // Get application metrics
  const appMetrics = {
    requests: {
      total: 0, // Would be tracked by middleware
      errors: 0,
      active: 0,
    },
    database: {
      queries: performanceMetrics['db.query'] || {},
      transactions: performanceMetrics['db.transaction'] || {},
    },
    cache: {
      reads: performanceMetrics['cache.read'] || {},
      writes: performanceMetrics['cache.write'] || {},
    },
    external: {
      ai: performanceMetrics['api.ai'] || {},
      other: performanceMetrics['api.external'] || {},
    },
  };

  // Format for Prometheus if requested
  if (event.node.req.headers.accept?.includes('text/plain')) {
    return formatPrometheusMetrics({
      system: systemMetrics,
      app: appMetrics,
      performance: performanceMetrics,
    });
  }

  // Return JSON format
  return {
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    application: appMetrics,
    performance: performanceMetrics,
  };
});

function formatPrometheusMetrics(metrics: any): string {
  const lines: string[] = [];
  
  // System metrics
  lines.push('# HELP process_memory_rss_bytes Resident Set Size');
  lines.push('# TYPE process_memory_rss_bytes gauge');
  lines.push(`process_memory_rss_bytes ${metrics.system.memory.rss}`);
  
  lines.push('# HELP process_memory_heap_used_bytes Heap Used');
  lines.push('# TYPE process_memory_heap_used_bytes gauge');
  lines.push(`process_memory_heap_used_bytes ${metrics.system.memory.heapUsed}`);
  
  lines.push('# HELP process_uptime_seconds Process Uptime');
  lines.push('# TYPE process_uptime_seconds counter');
  lines.push(`process_uptime_seconds ${metrics.system.uptime}`);
  
  // Performance metrics
  for (const [name, stats] of Object.entries(metrics.performance)) {
    if (typeof stats === 'object' && stats.count > 0) {
      const metricName = name.replace(/\./g, '_');
      
      lines.push(`# HELP ${metricName}_duration_milliseconds ${name} duration`);
      lines.push(`# TYPE ${metricName}_duration_milliseconds summary`);
      lines.push(`${metricName}_duration_milliseconds{quantile="0.5"} ${stats.median}`);
      lines.push(`${metricName}_duration_milliseconds{quantile="0.95"} ${stats.p95}`);
      lines.push(`${metricName}_duration_milliseconds{quantile="0.99"} ${stats.p99}`);
      lines.push(`${metricName}_duration_milliseconds_sum ${stats.avg * stats.count}`);
      lines.push(`${metricName}_duration_milliseconds_count ${stats.count}`);
    }
  }
  
  return lines.join('\n');
}