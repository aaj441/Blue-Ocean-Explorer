import crypto from 'crypto';
import { z } from 'zod';
import { AppError, ValidationError } from './errors';
import { logger } from './logger';
import { env } from '~/server/env';

// Input sanitization
export function sanitizeInput(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// SQL injection prevention (for raw queries)
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation with additional checks
export const emailSchema = z
  .string()
  .email()
  .toLowerCase()
  .refine((email) => {
    // Check for disposable email domains
    const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
    const domain = email.split('@')[1];
    return !disposableDomains.includes(domain);
  }, 'Disposable email addresses are not allowed');

// Rate limiting key generation with IP normalization
export function getRateLimitKey(ip: string, endpoint: string): string {
  // Normalize IPv6 addresses
  const normalizedIp = ip.includes(':') ? ip.toLowerCase().replace(/::ffff:/i, '') : ip;
  return `rate_limit:${normalizedIp}:${endpoint}`;
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

// File upload validation
export interface FileUploadOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export function validateFileUpload(
  file: { size: number; type: string; name: string },
  options: FileUploadOptions
): void {
  // Check file size
  if (file.size > options.maxSize) {
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${options.maxSize / 1024 / 1024}MB`
    );
  }

  // Check MIME type
  if (!options.allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    );
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !options.allowedExtensions.includes(extension)) {
    throw new ValidationError(
      `File extension .${extension} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
    );
  }

  // Check for double extensions
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const suspiciousExtensions = ['php', 'exe', 'sh', 'bat', 'cmd'];
    for (const part of parts.slice(0, -1)) {
      if (suspiciousExtensions.includes(part.toLowerCase())) {
        throw new ValidationError('Suspicious file name detected');
      }
    }
  }
}

// API key generation
export function generateAPIKey(): string {
  const prefix = 'sk_' + (env.NODE_ENV === 'production' ? 'live' : 'test') + '_';
  const key = crypto.randomBytes(32).toString('base64url');
  return prefix + key;
}

// API key hashing (store only hash in database)
export function hashAPIKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Content Security Policy generator
export function generateCSP(nonce?: string): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
      'https://cdn.jsdelivr.net',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'connect-src': [
      "'self'",
      'https://api.openrouter.ai',
      env.NODE_ENV === 'development' ? 'ws://localhost:*' : 'wss://*',
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'script-src-attr': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// Session security
export interface SessionOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

export function getSessionOptions(): SessionOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Number(env.SESSION_MAX_AGE || 30 * 24 * 60 * 60 * 1000), // 30 days
    path: '/',
  };
}

// IP address validation and normalization
export function normalizeIP(ip: string): string {
  // Handle IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
}

export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
    /^fe80::/,
    /^fc00::/,
  ];

  const normalizedIP = normalizeIP(ip);
  return privateRanges.some(range => range.test(normalizedIP));
}

// Security headers validation
export function validateSecurityHeaders(headers: Record<string, string>): void {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
  ];

  const missingHeaders = requiredHeaders.filter(header => !headers[header.toLowerCase()]);
  
  if (missingHeaders.length > 0) {
    logger.warn('Missing security headers', { missingHeaders });
  }
}

// Audit logging for security events
export function auditLog(
  event: string,
  userId: number | null,
  details: Record<string, any>
): void {
  logger.info('Security audit', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

// Encryption utilities
export function encrypt(text: string, key: string = env.JWT_SECRET): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(64);
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedText: string, key: string = env.JWT_SECRET): string {
  const algorithm = 'aes-256-gcm';
  const buffer = Buffer.from(encryptedText, 'base64');
  
  const salt = buffer.slice(0, 64);
  const iv = buffer.slice(64, 80);
  const tag = buffer.slice(80, 96);
  const encrypted = buffer.slice(96);
  
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  
  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  decipher.setAuthTag(tag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}