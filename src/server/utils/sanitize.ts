/**
 * Input sanitization utilities for production-grade security
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize SQL input to prevent SQL injection
 * Note: This is a basic implementation. Use parameterized queries with Prisma (which we do)
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/'/g, "''")
    .replace(/;/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "");
}

/**
 * Sanitize file names to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== "string") return "";

  return fileName
    .replace(/\.\./g, "")
    .replace(/\//g, "")
    .replace(/\\/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 255);
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") return "";

  // Only allow relative URLs or URLs from allowed domains
  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const allowedDomains = [
      "localhost",
      "127.0.0.1",
      // Add your production domains here
    ];

    if (allowedDomains.includes(parsed.hostname)) {
      return url;
    }
  } catch {
    // Invalid URL
  }

  return "/";
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";

  return email.toLowerCase().trim();
}

/**
 * Remove null bytes from string (can cause issues in C-based systems)
 */
export function removeNullBytes(input: string): string {
  if (typeof input !== "string") return "";

  return input.replace(/\0/g, "");
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    html?: boolean;
    nullBytes?: boolean;
  } = {},
): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (typeof value === "string") {
      let sanitized = value;

      if (options.nullBytes !== false) {
        sanitized = removeNullBytes(sanitized);
      }

      if (options.html) {
        sanitized = sanitizeHtml(sanitized);
      }

      result[key] = sanitized as any;
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value, options);
    }
  }

  return result;
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInt(
  value: any,
  options: { min?: number; max?: number; default?: number } = {},
): number {
  const parsed = parseInt(String(value), 10);

  if (isNaN(parsed)) {
    return options.default ?? 0;
  }

  if (options.min !== undefined && parsed < options.min) {
    return options.min;
  }

  if (options.max !== undefined && parsed > options.max) {
    return options.max;
  }

  return parsed;
}

/**
 * Validate and sanitize float input
 */
export function sanitizeFloat(
  value: any,
  options: { min?: number; max?: number; default?: number } = {},
): number {
  const parsed = parseFloat(String(value));

  if (isNaN(parsed)) {
    return options.default ?? 0;
  }

  if (options.min !== undefined && parsed < options.min) {
    return options.min;
  }

  if (options.max !== undefined && parsed > options.max) {
    return options.max;
  }

  return parsed;
}

/**
 * Truncate string to maximum length
 */
export function truncateString(str: string, maxLength: number = 1000): string {
  if (typeof str !== "string") return "";
  return str.substring(0, maxLength);
}
