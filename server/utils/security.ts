import { z } from 'zod';
import { RateLimitError, ValidationError } from './errors';
import { logger } from './logger';
import { env } from '../env';

/**
 * Rate limiting implementation
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = parseInt(env.RATE_LIMIT_WINDOW_MS), maxRequests: number = parseInt(env.RATE_LIMIT_MAX_REQUESTS)) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware for tRPC
 */
export function createRateLimitMiddleware(identifier: (ctx: any) => string) {
  return async (opts: any) => {
    const { ctx } = opts;
    const key = identifier(ctx);
    
    const result = rateLimiter.check(key);
    
    if (!result.allowed) {
      logger.security('Rate limit exceeded', ctx.req?.ip, ctx.req?.headers?.['user-agent'], 'medium');
      throw new RateLimitError('Too many requests. Please try again later.');
    }
    
    // Add rate limit headers to response if available
    if (ctx.res) {
      ctx.res.setHeader('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS);
      ctx.res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      ctx.res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    }
    
    return opts.next();
  };
}

/**
 * Input sanitization utilities
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * SQL injection prevention for raw queries
 */
export function escapeSQL(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, '');
}

/**
 * XSS prevention utilities
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Password strength validation
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation with additional security checks
 */
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .refine(email => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\+.*\+/, // Multiple plus signs
      /\.{2,}/, // Multiple consecutive dots
      /@.*@/, // Multiple @ symbols
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }, 'Email contains suspicious patterns');

/**
 * File upload validation
 */
export function validateFileUpload(file: any, allowedTypes: string[], maxSize: number) {
  if (!file) {
    throw new ValidationError('No file provided');
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(`File type ${file.mimetype} is not allowed`);
  }
  
  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }
  
  // Check for suspicious file names
  if (/[<>:"/\\|?*]/.test(file.originalname)) {
    throw new ValidationError('File name contains invalid characters');
  }
  
  return true;
}

/**
 * IP address utilities
 */
export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
    /^fc00:/,
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * CORS configuration
 */
export function getCorsOptions() {
  const origins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        logger.security('CORS violation', undefined, undefined, 'medium');
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}

/**
 * Content Security Policy configuration
 */
export function getCSPDirectives() {
  if (!env.HELMET_CSP_ENABLED) {
    return false;
  }
  
  return {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", "https://api.openrouter.ai", "https://api.stripe.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return (req: any, res: any, next: any) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    if (env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  };
}