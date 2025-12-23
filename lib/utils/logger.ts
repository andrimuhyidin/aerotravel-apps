/**
 * Structured Logging Helper
 * Wrapper untuk console.log dengan log levels dan structured format
 *
 * Usage:
 * import { logger } from '@/lib/utils/logger';
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Payment failed', { error, bookingId: '456' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Safe JSON stringify with circular reference handling
   */
  private safeStringify(obj: unknown): string {
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (_key, value) => {
        // Handle circular references
        if (value !== null && typeof value === 'object') {
          // Check for circular reference
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      return '[Unstringifiable]';
    }
  }

  /**
   * Format log message dengan context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${this.safeStringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug logs (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info logs
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    } else if (this.isProduction) {
      // In production, send to monitoring service
      // TODO: Integrate with log aggregation service (e.g., Datadog, LogRocket)
      console.log(this.formatMessage('info', message, context));
    }
  }

  /**
   * Warning logs
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));

    // In production, send warnings to monitoring
    if (this.isProduction && typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  /**
   * Error logs (always logged + sent to Sentry)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };

    console.error(this.formatMessage('error', message, errorContext));

    // Always send errors to Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      if (error instanceof Error) {
        window.Sentry.captureException(error, {
          extra: context,
        });
      } else {
        window.Sentry.captureMessage(message, {
          level: 'error',
          extra: errorContext,
        });
      }
    } else if (typeof process !== 'undefined') {
      // Server-side Sentry
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/nextjs');
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: context,
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: errorContext,
        });
      }
    }
  }

  /**
   * Performance logging
   */
  performance(label: string, startTime: number, context?: LogContext): void {
    const duration = performance.now() - startTime;
    this.debug(`Performance: ${label}`, {
      ...context,
      duration: `${duration.toFixed(2)}ms`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };

/**
 * Usage examples:
 *
 * import { logger } from '@/lib/utils/logger';
 *
 * // Debug (dev only)
 * logger.debug('Component rendered', { componentName: 'BookingForm' });
 *
 * // Info
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 *
 * // Warning
 * logger.warn('Rate limit approaching', { remaining: 5 });
 *
 * // Error (auto-sent to Sentry)
 * logger.error('Payment failed', error, { bookingId: '456' });
 *
 * // Performance
 * const start = performance.now();
 * await processPayment();
 * logger.performance('processPayment', start, { bookingId: '456' });
 */
