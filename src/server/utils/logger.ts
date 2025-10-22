type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };
    console.error(this.formatMessage("error", message, errorContext));
  }

  // Security logging
  security(event: string, context: LogContext) {
    this.warn(`SECURITY: ${event}`, context);
  }

  // Performance logging
  performance(operation: string, durationMs: number, context?: LogContext) {
    this.info(`PERFORMANCE: ${operation}`, {
      ...context,
      durationMs,
    });
  }

  // Audit logging for important business events
  audit(action: string, userId: number | string, context?: LogContext) {
    this.info(`AUDIT: ${action}`, {
      ...context,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new Logger();

// Performance measurement utility
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();

  return fn()
    .then((result) => {
      const duration = performance.now() - start;
      logger.performance(operation, duration);
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      logger.performance(`${operation} (failed)`, duration);
      throw error;
    });
}
