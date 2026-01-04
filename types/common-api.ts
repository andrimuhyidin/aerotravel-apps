/**
 * Common API Types
 * Reusable types for API routes to replace 'any' usage
 */

import { NextRequest, NextResponse } from 'next/server';

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T = unknown> = NextResponse<{
  data?: T;
  error?: string | ApiError;
  success?: boolean;
}>;

export type AuthenticatedRequest = NextRequest & {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
};

export type DatabaseError = {
  code: string;
  message: string;
  details: string;
  hint: string;
};

// Generic helper for JSON body parsing
export async function parseBody<T>(req: NextRequest): Promise<T> {
  return req.json() as Promise<T>;
}

// Type guard for database errors
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
