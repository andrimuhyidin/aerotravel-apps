/**
 * Sentry Initialization & Helper Functions
 * Error tracking & monitoring setup
 * 
 * Even if DSN is empty (dev), SDK is initialized to get familiar with error reporting flow
 */

import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN || env.SENTRY_DSN || undefined, // Works even if empty
  environment: env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Debug mode (dev only)
  debug: env.NODE_ENV === 'development',
  
  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask all text
      blockAllMedia: true, // Privacy: block all media
    }),
  ],
  
  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'Network request failed',
    // Third-party scripts
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
  ],
  
  // Release tracking
  release: process.env.npm_package_version,
});

// ============================================
// HELPER FUNCTIONS
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
