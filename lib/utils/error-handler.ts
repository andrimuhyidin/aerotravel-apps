/**
 * Enhanced Error Handler Utilities
 * Provides better error handling with recovery actions
 */

import { logger } from './logger';

export type ErrorType = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'unknown';

export interface ErrorWithRecovery {
  message: string;
  type: ErrorType;
  recoverable: boolean;
  retryable: boolean;
  recoveryAction?: {
    label: string;
    action: () => void | Promise<void>;
  };
  originalError?: unknown;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) return true;
  
  if (error instanceof Error) {
    // 5xx errors are usually retryable
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Parse error and create user-friendly message
 */
export function parseError(error: unknown): ErrorWithRecovery {
  const baseError: ErrorWithRecovery = {
    message: 'Terjadi kesalahan. Silakan coba lagi.',
    type: 'unknown',
    recoverable: false,
    retryable: false,
    originalError: error,
  };

  if (isNetworkError(error)) {
    return {
      ...baseError,
      message: 'Koneksi terputus. Periksa koneksi internet Anda.',
      type: 'network',
      recoverable: true,
      retryable: true,
    };
  }

  if (error instanceof Error) {
    // Authentication errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        ...baseError,
        message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        type: 'authentication',
        recoverable: true,
        retryable: false,
        recoveryAction: {
          label: 'Login',
          action: () => {
            window.location.href = '/login';
          },
        },
      };
    }

    // Authorization errors
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return {
        ...baseError,
        message: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
        type: 'authorization',
        recoverable: false,
        retryable: false,
      };
    }

    // Not found errors
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return {
        ...baseError,
        message: 'Data yang Anda cari tidak ditemukan.',
        type: 'not_found',
        recoverable: false,
        retryable: false,
      };
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return {
        ...baseError,
        message: 'Server sedang mengalami masalah. Silakan coba lagi nanti.',
        type: 'server',
        recoverable: true,
        retryable: true,
      };
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        ...baseError,
        message: error.message || 'Data yang Anda masukkan tidak valid.',
        type: 'validation',
        recoverable: true,
        retryable: false,
      };
    }

    // Use error message if available
    return {
      ...baseError,
      message: error.message,
      recoverable: true,
      retryable: isRetryableError(error),
    };
  }

  return baseError;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      if (!isRetryableError(error)) {
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, { error });
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Handle error with logging and user notification
 */
export function handleError(
  error: unknown,
  context?: {
    operation?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): ErrorWithRecovery {
  const parsedError = parseError(error);
  
  logger.error(
    context?.operation || 'Operation failed',
    error,
    {
      errorType: parsedError.type,
      recoverable: parsedError.recoverable,
      retryable: parsedError.retryable,
      ...context?.metadata,
    }
  );

  return parsedError;
}

