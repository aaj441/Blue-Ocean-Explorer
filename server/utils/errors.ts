import { TRPCError } from '@trpc/server';
import { z } from 'zod';

/**
 * Custom error types for the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      502,
      true,
      'EXTERNAL_SERVICE_ERROR'
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Convert various error types to tRPC errors
 */
export function toTRPCError(error: unknown): TRPCError {
  // If it's already a tRPC error, return as is
  if (error instanceof TRPCError) {
    return error;
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    switch (error.constructor) {
      case ValidationError:
        return new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
          cause: error,
        });
      case AuthenticationError:
        return new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
          cause: error,
        });
      case AuthorizationError:
        return new TRPCError({
          code: 'FORBIDDEN',
          message: error.message,
          cause: error,
        });
      case NotFoundError:
        return new TRPCError({
          code: 'NOT_FOUND',
          message: error.message,
          cause: error,
        });
      case ConflictError:
        return new TRPCError({
          code: 'CONFLICT',
          message: error.message,
          cause: error,
        });
      case RateLimitError:
        return new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error.message,
          cause: error,
        });
      case ExternalServiceError:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
          cause: error,
        });
    }
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const message = error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: `Validation error: ${message}`,
      cause: error,
    });
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return new TRPCError({
          code: 'CONFLICT',
          message: 'A record with this data already exists',
          cause: error,
        });
      case 'P2025':
        return new TRPCError({
          code: 'NOT_FOUND',
          message: 'Record not found',
          cause: error,
        });
      case 'P2003':
        return new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Foreign key constraint failed',
          cause: error,
        });
      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database error occurred',
          cause: error,
        });
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    });
  }

  // Fallback for unknown errors
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    cause: error,
  });
}

/**
 * Error logging utility
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : 'UnknownError',
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, Winston, etc.)
    console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('Application Error:', errorInfo);
  }
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { functionName: fn.name, args });
      throw toTRPCError(error);
    }
  };
}

/**
 * Retry mechanism for external service calls
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(backoffMultiplier, attempt - 1))
      );
    }
  }
  
  throw lastError;
}