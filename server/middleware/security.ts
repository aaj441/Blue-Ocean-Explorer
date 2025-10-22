import { defineEventHandler } from '@tanstack/react-start/server';
import { env } from '~/server/env';

export const securityHeaders = defineEventHandler(async (event) => {
  const headers = event.node.res;
  
  // Basic security headers
  headers.setHeader('X-Content-Type-Options', 'nosniff');
  headers.setHeader('X-Frame-Options', 'DENY');
  headers.setHeader('X-XSS-Protection', '1; mode=block');
  headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openrouter.ai wss://localhost:* ws://localhost:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  headers.setHeader('Content-Security-Policy', csp);
  
  // Strict Transport Security (only in production with HTTPS)
  if (env.NODE_ENV === 'production') {
    headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Permissions Policy
  headers.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// CORS configuration
export const corsHandler = defineEventHandler(async (event) => {
  const origin = event.node.req.headers.origin;
  const allowedOrigins = env.CORS_ORIGIN || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    event.node.res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (env.NODE_ENV === 'development') {
    // Allow all origins in development
    event.node.res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  event.node.res.setHeader('Access-Control-Allow-Credentials', 'true');
  event.node.res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204;
    event.node.res.end();
    return;
  }
});