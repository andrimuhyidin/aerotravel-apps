/**
 * API Error Handler Middleware
 * Sesuai Enterprise Best Practices - Error Handling
 * 
 * Standardized error handling for API routes
 */

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Log error to Sentry
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      Sentry.captureException(error, {
        tags: {
          errorCode: error.code,
        },
        extra: {
          details: error.details,
        },
      });
    }
  } else if (error instanceof Error) {
    Sentry.captureException(error);
  }

  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        statusCode: 400,
        details: error,
      },
      { status: 400 }
    );
  }

  // Handle unknown errors
  logger.error('Unhandled API error', error);
  
  return NextResponse.json(
    {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Internal server error',
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Create error response helpers
 */
export const createError = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCodes.UNAUTHORIZED, message, 401),
  
  forbidden: (message = 'Forbidden') =>
    new AppError(ErrorCodes.FORBIDDEN, message, 403),
  
  notFound: (message = 'Resource not found') =>
    new AppError(ErrorCodes.NOT_FOUND, message, 404),
  
  validation: (message = 'Validation failed', details?: unknown) =>
    new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details),
  
  conflict: (message = 'Resource conflict') =>
    new AppError(ErrorCodes.CONFLICT, message, 409),
  
  rateLimit: (message = 'Rate limit exceeded') =>
    new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429),
  
  internal: (message = 'Internal server error', details?: unknown) =>
    new AppError(ErrorCodes.INTERNAL_ERROR, message, 500, details),
};

