/**
 * Sentry Initialization
 * Error tracking & monitoring setup
 * 
 * Even if DSN is empty (dev), SDK is initialized to get familiar with error reporting flow
 */

import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env';

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

