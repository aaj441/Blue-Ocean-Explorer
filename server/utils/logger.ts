import { env } from '~/server/env';
import * as Sentry from '@sentry/node';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogContext {
  userId?: number;
  requestId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isDevelopment = env.NODE_ENV === 'development';
  private logLevel = env.LOG_LEVEL;
  private logFormat = env.LOG_FORMAT;

  private constructor() {
    // Initialize Sentry if DSN is provided
    if (env.SENTRY_DSN) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      });
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string | object {
    const timestamp = new Date().toISOString();
    
    if (this.logFormat === 'json') {
      return {
        timestamp,
        level,
        message,
        ...context,
      };
    }
    
    // Pretty format for development
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        // Send to Sentry
        if (env.SENTRY_DSN && context?.error) {
          Sentry.captureException(context.error, {
            extra: context,
          });
        }
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
      case 'trace':
        console.trace(formatted);
        break;
    }
  }

  error(message: string, context?: LogContext & { error?: Error }): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  // Helper method for logging HTTP requests
  logRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode} ${duration}ms`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  // Helper method for logging database queries
  logQuery(query: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug(`Database query executed in ${duration}ms`, {
        query,
        duration,
        ...context,
      });
    }
  }

  // Helper method for logging cache operations
  logCache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: LogContext): void {
    this.debug(`Cache ${operation}: ${key}`, {
      cacheOperation: operation,
      cacheKey: key,
      ...context,
    });
  }
}

export const logger = Logger.getInstance();