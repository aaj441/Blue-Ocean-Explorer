/**
 * Security middleware and utilities
 */

import { logger } from "../utils/logger";

/**
 * Security headers for HTTP responses
 */
export const securityHeaders = {
  // Prevent XSS attacks
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; "),

  // HTTPS enforcement (in production)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

/**
 * CORS configuration
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // Add production domains here
  ];

  if (process.env.NODE_ENV === "development") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  return {};
}

/**
 * Validate JWT token structure (basic validation)
 */
export function validateTokenStructure(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) {
    logger.security("Invalid JWT structure", { partsCount: parts.length });
    return false;
  }

  // Each part should be base64 encoded
  try {
    parts.forEach((part) => {
      if (part) {
        atob(part.replace(/-/g, "+").replace(/_/g, "/"));
      }
    });
    return true;
  } catch {
    logger.security("Invalid JWT encoding", {});
    return false;
  }
}

/**
 * Detect potential SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*=.*=/, // OR 1=1, AND 1=1
    /(\bUNION\b.*\bSELECT\b)/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      logger.security("Potential SQL injection detected", { input });
      return true;
    }
  }

  return false;
}

/**
 * Detect potential XSS patterns
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      logger.security("Potential XSS detected", { input });
      return true;
    }
  }

  return false;
}

/**
 * Validate email format (more strict than basic regex)
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email regex (simplified)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  if (email.length > 254) {
    return false;
  }

  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return false;
  }

  if (local.length > 64) {
    return false;
  }

  return true;
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
