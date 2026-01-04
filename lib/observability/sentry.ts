/**
 * Sentry Helper Functions (Server-Safe)
 * Error tracking & monitoring setup
 * 
 * This file is safe to use on both client and server.
 * Actual initialization is done in sentry.client.config.ts and sentry.server.config.ts
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

// ============================================
// HELPER FUNCTIONS (Server-Safe)
// ============================================

/**
 * Capture exception to Sentry
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  logger.error('[Sentry] Capturing exception', error, context?.extra);

  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture message to Sentry
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  logger.warn('[Sentry] Capturing message', { message, ...context?.extra });

  return Sentry.captureMessage(message, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'info',
  });
}

/**
 * Capture security event to Sentry with appropriate severity
 */
export function captureSecurityEvent(
  eventType: 'failed_login' | 'rate_limit' | 'suspicious' | 'brute_force_detected',
  context: {
    email?: string;
    ip?: string;
    reason?: string;
    severity?: string;
  }
): string {
  const level: Sentry.SeverityLevel =
    eventType === 'suspicious' || eventType === 'brute_force_detected' ? 'error' : 'warning';

  return Sentry.captureMessage(`Security Event: ${eventType}`, {
    level,
    tags: {
      security_event: eventType,
      ip: context.ip || 'unknown',
      severity: context.severity || 'medium',
    },
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}
