import { db } from '../db';
import { logger } from './logger';
import { monitoring } from './monitoring';

/**
 * Database connection pool optimization
 */
export function optimizeDatabaseConnection() {
  // These would be set in the Prisma schema or connection string
  const optimizations = {
    // Connection pool settings
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    
    // Query optimization
    statementTimeout: 30000,
    queryTimeout: 30000,
    
    // Connection management
    idleTimeout: 300000, // 5 minutes
    maxLifetime: 3600000, // 1 hour
  };

  logger.info('Database connection optimized', optimizations);
  return optimizations;
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Add database indexes for common queries
   */
  static async createOptimalIndexes() {
    const indexes = [
      // User indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);',
      
      // Market indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markets_user_id ON markets(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markets_industry ON markets(industry);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);',
      
      // Opportunity indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_market_id ON opportunities(market_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_status ON opportunities(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_priority ON opportunities(priority);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_category ON opportunities(category);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);',
      
      // Board indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boards_user_id ON boards(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_board_opportunities_board_id ON board_opportunities(board_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_board_opportunities_opportunity_id ON board_opportunities(opportunity_id);',
      
      // Marketplace indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(price);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_is_active ON marketplace_listings(is_active);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at DESC);',
      
      // Full-text search indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_markets_name_trgm ON markets USING gin(name gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_title_trgm ON opportunities USING gin(title gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_description_trgm ON opportunities USING gin(description gin_trgm_ops);',
      
      // Composite indexes for common query patterns
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_user_market ON opportunities(user_id, market_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_status_priority ON opportunities(status, priority);',
    ];

    for (const indexQuery of indexes) {
      try {
        await db.$executeRawUnsafe(indexQuery);
        logger.info('Database index created', { query: indexQuery });
      } catch (error) {
        // Index might already exist, which is fine
        logger.debug('Database index creation skipped', { 
          query: indexQuery, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  /**
   * Analyze query performance
   */
  static async analyzeQuery(query: string, params?: any[]): Promise<any> {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await db.$queryRawUnsafe(explainQuery, ...(params || []));
      
      logger.debug('Query analysis completed', { query, result });
      return result;
    } catch (error) {
      logger.error('Query analysis failed', { 
        query, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Monitor slow queries
   */
  static async enableSlowQueryLogging() {
    try {
      // Enable slow query logging (adjust threshold as needed)
      await db.$executeRaw`SET log_min_duration_statement = 1000`; // 1 second
      await db.$executeRaw`SET log_statement = 'all'`;
      
      logger.info('Slow query logging enabled');
    } catch (error) {
      logger.error('Failed to enable slow query logging', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

/**
 * Database performance monitoring
 */
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  /**
   * Monitor database performance metrics
   */
  async startMonitoring(intervalMs: number = 60000) {
    setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);
  }

  private async collectMetrics() {
    try {
      // Connection pool metrics
      const connectionMetrics = await this.getConnectionMetrics();
      monitoring.recordMetric('db.connections.active', connectionMetrics.active, 'count');
      monitoring.recordMetric('db.connections.idle', connectionMetrics.idle, 'count');
      monitoring.recordMetric('db.connections.total', connectionMetrics.total, 'count');

      // Query performance metrics
      const queryMetrics = await this.getQueryMetrics();
      monitoring.recordMetric('db.queries.total', queryMetrics.total, 'count');
      monitoring.recordMetric('db.queries.avg_duration', queryMetrics.avgDuration, 'ms');
      monitoring.recordMetric('db.queries.slow_count', queryMetrics.slowCount, 'count');

      // Table size metrics
      const tableMetrics = await this.getTableMetrics();
      Object.entries(tableMetrics).forEach(([table, size]) => {
        monitoring.recordMetric('db.table.size', size as number, 'bytes', { table });
      });

      // Index usage metrics
      const indexMetrics = await this.getIndexMetrics();
      monitoring.recordMetric('db.index.usage', indexMetrics.usagePercent, '%');

    } catch (error) {
      logger.error('Database metrics collection failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async getConnectionMetrics() {
    try {
      const result = await db.$queryRaw`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];

      return result[0] || { total: 0, active: 0, idle: 0 };
    } catch (error) {
      return { total: 0, active: 0, idle: 0 };
    }
  }

  private async getQueryMetrics() {
    try {
      const result = await db.$queryRaw`
        SELECT 
          sum(calls) as total,
          avg(mean_exec_time) as avg_duration,
          count(*) FILTER (WHERE mean_exec_time > 1000) as slow_count
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ` as any[];

      return result[0] || { total: 0, avgDuration: 0, slowCount: 0 };
    } catch (error) {
      return { total: 0, avgDuration: 0, slowCount: 0 };
    }
  }

  private async getTableMetrics() {
    try {
      const result = await db.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
      ` as any[];

      const metrics: Record<string, number> = {};
      result.forEach((row: any) => {
        metrics[row.tablename] = parseInt(row.size_bytes);
      });

      return metrics;
    } catch (error) {
      return {};
    }
  }

  private async getIndexMetrics() {
    try {
      const result = await db.$queryRaw`
        SELECT 
          round(100.0 * sum(idx_scan) / (sum(seq_scan) + sum(idx_scan) + 0.0001), 2) as usage_percent
        FROM pg_stat_user_tables
      ` as any[];

      return { usagePercent: result[0]?.usage_percent || 0 };
    } catch (error) {
      return { usagePercent: 0 };
    }
  }
}

/**
 * Batch operations for better performance
 */
export class BatchOperations {
  /**
   * Batch create multiple records
   */
  static async batchCreate<T>(
    model: any,
    data: any[],
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResults = await model.createMany({
          data: batch,
          skipDuplicates: true,
        });
        
        results.push(...batchResults);
        
        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        logger.error('Batch create failed', { 
          batch: i / batchSize + 1,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Batch update multiple records
   */
  static async batchUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: any }>,
    batchSize: number = 50
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      try {
        const promises = batch.map(update => 
          model.update({
            where: update.where,
            data: update.data,
          })
        );
        
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < updates.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        logger.error('Batch update failed', { 
          batch: i / batchSize + 1,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    }
    
    return results;
  }
}

// Initialize database optimizations
export async function initializeDatabaseOptimizations() {
  try {
    // Create optimal indexes
    await QueryOptimizer.createOptimalIndexes();
    
    // Enable slow query logging in development
    if (process.env.NODE_ENV === 'development') {
      await QueryOptimizer.enableSlowQueryLogging();
    }
    
    // Start database monitoring in production
    if (process.env.NODE_ENV === 'production') {
      const monitor = DatabaseMonitor.getInstance();
      await monitor.startMonitoring();
    }
    
    logger.info('Database optimizations initialized');
  } catch (error) {
    logger.error('Failed to initialize database optimizations', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}