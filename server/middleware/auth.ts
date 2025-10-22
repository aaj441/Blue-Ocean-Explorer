import { defineEventHandler, sendError, createError } from '@tanstack/react-start/server';
import { authenticateUser } from '~/server/utils/auth';
import { logger } from '~/server/utils/logger';
import { auditLog } from '~/server/utils/security';

interface AuthOptions {
  required?: boolean;
  roles?: string[];
  skipPaths?: string[];
}

export function createAuthMiddleware(options: AuthOptions = {}) {
  const { required = true, roles = [], skipPaths = [] } = options;

  return defineEventHandler(async (event) => {
    const path = event.node.req.url || '';
    
    // Skip authentication for certain paths
    if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
      return;
    }

    // Extract token from Authorization header
    const authHeader = event.node.req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (required) {
        return sendError(event, createError({
          statusCode: 401,
          statusMessage: 'Missing authentication token',
        }));
      }
      return;
    }

    const token = authHeader.substring(7);

    try {
      // Authenticate user
      const user = await authenticateUser(token);
      
      // Check role requirements
      if (roles.length > 0 && !roles.includes(user.role)) {
        auditLog('unauthorized_access_attempt', user.id, {
          path,
          requiredRoles: roles,
          userRole: user.role,
        });

        return sendError(event, createError({
          statusCode: 403,
          statusMessage: 'Insufficient permissions',
        }));
      }

      // Add user to context
      event.context.user = user;
      event.context.userId = user.id;

      // Log successful authentication for sensitive endpoints
      if (path.includes('/admin') || path.includes('/api/internal')) {
        auditLog('authenticated_access', user.id, {
          path,
          method: event.node.req.method,
        });
      }
    } catch (error) {
      logger.warn('Authentication failed', {
        error,
        path,
        ip: event.node.req.socket.remoteAddress,
      });

      if (required) {
        return sendError(event, createError({
          statusCode: 401,
          statusMessage: 'Invalid or expired token',
        }));
      }
    }
  });
}

// Specific auth middleware instances
export const requireAuth = createAuthMiddleware({ required: true });

export const optionalAuth = createAuthMiddleware({ required: false });

export const requireAdmin = createAuthMiddleware({
  required: true,
  roles: ['ADMIN'],
});

export const requireExecutive = createAuthMiddleware({
  required: true,
  roles: ['EXECUTIVE', 'ADMIN'],
});

// API key authentication middleware
export function createAPIKeyMiddleware(options: { header?: string } = {}) {
  const headerName = options.header || 'x-api-key';

  return defineEventHandler(async (event) => {
    const apiKey = event.node.req.headers[headerName] as string;

    if (!apiKey) {
      return sendError(event, createError({
        statusCode: 401,
        statusMessage: 'Missing API key',
      }));
    }

    // TODO: Validate API key against database
    // For now, just check format
    if (!apiKey.startsWith('sk_')) {
      return sendError(event, createError({
        statusCode: 401,
        statusMessage: 'Invalid API key format',
      }));
    }

    // Add API key info to context
    event.context.apiKey = apiKey;
  });
}