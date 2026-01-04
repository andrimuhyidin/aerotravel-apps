/**
 * Structured Logging Helper
 * Wrapper untuk console.log dengan log levels dan structured format
 * Supports log aggregation to external services (Axiom, Logtail, etc.)
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

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  environment?: string;
  service?: string;
}

// Log buffer for batch shipping
const logBuffer: LogEntry[] = [];
const LOG_BUFFER_SIZE = 10;
const LOG_FLUSH_INTERVAL = 5000; // 5 seconds

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private logServiceUrl = process.env.LOG_SERVICE_URL;
  private logServiceToken = process.env.LOG_SERVICE_TOKEN;
  private flushTimer: NodeJS.Timeout | null = null;

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
   * Ship logs to external aggregation service
   * Supports Axiom, Logtail, Datadog, or any service with HTTP ingest
   */
  private async shipLogs(entries: LogEntry[]): Promise<void> {
    if (!this.logServiceUrl || !this.logServiceToken) {
      return;
    }

    try {
      await fetch(this.logServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.logServiceToken}`,
        },
        body: JSON.stringify(entries),
      });
    } catch {
      // Silently fail - don't break the app for logging issues
      // Log to console as fallback
      console.warn('[Logger] Failed to ship logs to external service');
    }
  }

  /**
   * Add log to buffer and flush if needed
   */
  private bufferLog(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isProduction || !this.logServiceUrl) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: process.env.NODE_ENV,
      service: 'aero-apps',
    };

    logBuffer.push(entry);

    // Flush if buffer is full
    if (logBuffer.length >= LOG_BUFFER_SIZE) {
      this.flushLogs();
    }

    // Set up timer for periodic flush
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushLogs();
      }, LOG_FLUSH_INTERVAL);
    }
  }

  /**
   * Flush buffered logs to external service
   */
  flushLogs(): void {
    if (logBuffer.length === 0) {
      return;
    }

    const logsToShip = [...logBuffer];
    logBuffer.length = 0;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Ship async without blocking
    this.shipLogs(logsToShip).catch(() => {
      // Silently fail
    });
  }

  /**
   * Info logs
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    } else if (this.isProduction) {
      console.log(this.formatMessage('info', message, context));
      // Ship to external log aggregation service
      this.bufferLog('info', message, context);
    }
  }

  /**
   * Warning logs
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));

    // Ship to external log aggregation service
    this.bufferLog('warn', message, context);

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
