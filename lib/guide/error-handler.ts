/**
 * Enhanced Error Handling for Guide App
 * Contextual error messages with actionable suggestions
 */

import { logger } from '@/lib/utils/logger';

export type ErrorContext = {
  action?: string;
  resource?: string;
  userId?: string;
  tripId?: string;
  [key: string]: unknown;
};

export type ErrorInfo = {
  message: string;
  suggestion?: string;
  retryable: boolean;
  code?: string;
};

/**
 * Map error to user-friendly message with suggestion
 */
export function getErrorInfo(error: unknown, context?: ErrorContext): ErrorInfo {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Tidak dapat terhubung ke server',
      suggestion: 'Periksa koneksi internet Anda. Data akan disinkronkan otomatis saat online.',
      retryable: true,
      code: 'NETWORK_ERROR',
    };
  }

  // Offline errors
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      message: 'Anda sedang offline',
      suggestion: 'Aplikasi akan bekerja offline. Perubahan akan disinkronkan saat koneksi tersedia.',
      retryable: false,
      code: 'OFFLINE',
    };
  }

  // HTTP errors
  if (error instanceof Response) {
    const status = error.status;
    
    if (status === 401) {
      return {
        message: 'Sesi Anda telah berakhir',
        suggestion: 'Silakan login ulang untuk melanjutkan.',
        retryable: false,
        code: 'UNAUTHORIZED',
      };
    }

    if (status === 403) {
      return {
        message: 'Akses ditolak',
        suggestion: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
        retryable: false,
        code: 'FORBIDDEN',
      };
    }

    if (status === 404) {
      return {
        message: 'Data tidak ditemukan',
        suggestion: context?.resource
          ? `${context.resource} tidak ditemukan. Mungkin telah dihapus.`
          : 'Data yang Anda cari tidak ditemukan.',
        retryable: false,
        code: 'NOT_FOUND',
      };
    }

    if (status === 429) {
      return {
        message: 'Terlalu banyak permintaan',
        suggestion: 'Tunggu beberapa saat sebelum mencoba lagi.',
        retryable: true,
        code: 'RATE_LIMIT',
      };
    }

    if (status >= 500) {
      return {
        message: 'Terjadi kesalahan pada server',
        suggestion: 'Silakan coba lagi dalam beberapa saat. Jika masalah berlanjut, hubungi tim support.',
        retryable: true,
        code: 'SERVER_ERROR',
      };
    }
  }

  // Generic error
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('geofencing') || error.message.includes('lokasi')) {
      return {
        message: 'Lokasi tidak valid',
        suggestion: 'Pastikan Anda berada di lokasi yang benar untuk melakukan check-in.',
        retryable: true,
        code: 'GEOFENCING_ERROR',
      };
    }

    if (error.message.includes('permission') || error.message.includes('izin')) {
      return {
        message: 'Izin tidak diberikan',
        suggestion: 'Berikan izin akses lokasi di pengaturan browser/perangkat Anda.',
        retryable: true,
        code: 'PERMISSION_ERROR',
      };
    }

    return {
      message: error.message || 'Terjadi kesalahan',
      suggestion: 'Silakan coba lagi. Jika masalah berlanjut, hubungi tim support.',
      retryable: true,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Fallback
  return {
    message: 'Terjadi kesalahan yang tidak diketahui',
    suggestion: 'Silakan coba lagi atau hubungi tim support jika masalah berlanjut.',
    retryable: true,
    code: 'UNKNOWN',
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const errorInfo = getErrorInfo(error, context);
  
  logger.error('[GuideApp] Error occurred', error, {
    ...context,
    errorMessage: errorInfo.message,
    errorCode: errorInfo.code,
    retryable: errorInfo.retryable,
  });
}

/**
 * Create user-friendly error message
 */
export function getUserErrorMessage(error: unknown, context?: ErrorContext): string {
  const errorInfo = getErrorInfo(error, context);
  return errorInfo.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = getErrorInfo(error);
  return errorInfo.retryable;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        
        logger.info('[GuideApp] Retrying after error', {
          attempt: attempt + 1,
          maxRetries,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

