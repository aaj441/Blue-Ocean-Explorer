import { env } from '../env';

export interface LogContext {
  [key: string]: any;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private logLevel: LogLevel;
  private format: 'json' | 'pretty';

  constructor() {
    this.logLevel = env.LOG_LEVEL;
    this.format = env.LOG_FORMAT;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return levels[level] <= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.format === 'json') {
      return JSON.stringify(logEntry);
    }

    // Pretty format for development
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Specialized logging methods
  request(method: string, url: string, statusCode?: number, duration?: number) {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  database(operation: string, table?: string, duration?: number) {
    this.debug('Database Operation', {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  auth(event: string, userId?: string, email?: string) {
    this.info('Auth Event', {
      event,
      userId,
      email,
    });
  }

  payment(event: string, amount?: number, currency?: string, paymentId?: string) {
    this.info('Payment Event', {
      event,
      amount,
      currency,
      paymentId,
    });
  }

  ai(provider: string, model?: string, tokens?: number, cost?: number) {
    this.info('AI Service Call', {
      provider,
      model,
      tokens,
      cost,
    });
  }

  performance(metric: string, value: number, unit: string = 'ms') {
    this.debug('Performance Metric', {
      metric,
      value,
      unit,
    });
  }

  security(event: string, ip?: string, userAgent?: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    this.warn('Security Event', {
      event,
      ip,
      userAgent,
      severity,
    });
  }
}

export const logger = new Logger();

// Performance timing utility
export class Timer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    logger.performance(this.label, duration);
    return duration;
  }
}

// Request ID utility for tracing
let requestIdCounter = 0;
export function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`;
}

// Middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Log request start
    logger.request(req.method, req.url);
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.request(req.method, req.url, res.statusCode, duration);
    });
    
    next();
  };
}