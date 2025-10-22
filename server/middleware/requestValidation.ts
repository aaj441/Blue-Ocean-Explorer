import { defineEventHandler, sendError, createError } from '@tanstack/react-start/server';
import { z } from 'zod';
import { logger } from '~/server/utils/logger';

interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export function createValidationMiddleware(options: ValidationOptions) {
  return defineEventHandler(async (event) => {
    const errors: Record<string, any> = {};
    
    // Validate body
    if (options.body) {
      try {
        const body = await readBody(event);
        const validated = options.body.parse(body);
        event.context.validatedBody = validated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.body = error.errors;
        } else {
          errors.body = [{ message: 'Invalid request body' }];
        }
      }
    }
    
    // Validate query parameters
    if (options.query) {
      try {
        const query = getQuery(event);
        const validated = options.query.parse(query);
        event.context.validatedQuery = validated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.query = error.errors;
        } else {
          errors.query = [{ message: 'Invalid query parameters' }];
        }
      }
    }
    
    // Validate route parameters
    if (options.params) {
      try {
        const params = event.context.params || {};
        const validated = options.params.parse(params);
        event.context.validatedParams = validated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.params = error.errors;
        } else {
          errors.params = [{ message: 'Invalid route parameters' }];
        }
      }
    }
    
    // Validate headers
    if (options.headers) {
      try {
        const headers = event.node.req.headers;
        const validated = options.headers.parse(headers);
        event.context.validatedHeaders = validated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.headers = error.errors;
        } else {
          errors.headers = [{ message: 'Invalid headers' }];
        }
      }
    }
    
    // If there are any validation errors, return 400
    if (Object.keys(errors).length > 0) {
      logger.warn('Request validation failed', {
        path: event.node.req.url,
        method: event.node.req.method,
        errors,
      });
      
      return sendError(event, createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          message: 'Request validation failed',
          errors,
        },
      }));
    }
  });
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  // ID parameter
  idParam: z.object({
    id: z.coerce.number().int().positive(),
  }),
  
  // UUID parameter
  uuidParam: z.object({
    id: z.string().uuid(),
  }),
  
  // Search
  search: z.object({
    q: z.string().min(1).max(100),
    filters: z.record(z.string()).optional(),
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  // Auth header
  authHeader: z.object({
    authorization: z.string().regex(/^Bearer .+$/),
  }),
};

// Helper functions for reading request data
async function readBody(event: any): Promise<any> {
  if (event.node.req.method === 'GET' || event.node.req.method === 'HEAD') {
    return {};
  }
  
  const contentType = event.node.req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    return await useBody(event);
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    return await readFormData(event);
  } else if (contentType.includes('multipart/form-data')) {
    return await readMultipartFormData(event);
  }
  
  return {};
}

function getQuery(event: any): Record<string, any> {
  const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`);
  const query: Record<string, any> = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    if (query[key]) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  
  return query;
}

// Placeholder functions - implement based on your server framework
async function useBody(event: any): Promise<any> {
  // Implementation depends on your server framework
  return {};
}

async function readFormData(event: any): Promise<any> {
  // Implementation depends on your server framework
  return {};
}

async function readMultipartFormData(event: any): Promise<any> {
  // Implementation depends on your server framework
  return {};
}