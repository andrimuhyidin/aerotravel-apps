/**
 * Standardized API Response Format
 * 
 * All API endpoints should use these utilities for consistent response format:
 * - Success: { data: T, message?: string }
 * - Error: { error: string, code?: string, details?: unknown }
 */

import { NextResponse } from 'next/server';

/**
 * Standard success response format
 */
export type ApiSuccessResponse<T = unknown> = {
  data: T;
  message?: string;
};

/**
 * Standard error response format
 */
export type ApiErrorResponse = {
  error: string;
  code?: string;
  details?: unknown;
};

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  code?: string,
  details?: unknown,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
  };
  if (code) {
    response.code = code;
  }
  if (details !== undefined && details !== null) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create paginated response
 */
export type PaginatedApiResponse<T> = ApiSuccessResponse<{
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}>;

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<PaginatedApiResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    },
  });
}

