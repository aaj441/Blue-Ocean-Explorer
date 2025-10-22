import { defineEventHandler, sendError, createError } from '@tanstack/react-start/server';
import { handleError, AppError } from '~/server/utils/errors';
import { logger } from '~/server/utils/logger';

export const errorHandler = defineEventHandler(async (event) => {
  try {
    // Continue with the request
    return await event.next();
  } catch (error) {
    // Log the error
    handleError(error, {
      method: event.node.req.method,
      path: event.node.req.url,
      headers: event.node.req.headers,
    });

    // Convert to appropriate HTTP error
    if (error instanceof AppError) {
      return sendError(event, createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
        data: error.details,
      }));
    }

    // Default to 500 for unknown errors
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    }));
  }
});