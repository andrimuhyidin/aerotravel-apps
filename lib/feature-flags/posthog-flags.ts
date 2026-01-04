/**
 * PostHog Feature Flags
 * Sesuai PRD 2.2.E - Feature Flags (PostHog)
 * PRD 2.5.C - Feature Flagging
 * 
 * Memungkinkan Canary Release dan Kill Switch untuk fitur berisiko
 */

'use client';

import { posthog } from '@/lib/analytics/posthog';

export type FeatureFlag = 
  | 'payment-gateway'
  | 'ai-chatbot'
  | 'split-bill'
  | 'travel-circle'
  | 'vision-ai'
  | 'programmatic-seo'
  | 'customer-aeropoints'
  | 'referral-program'
  | 'corporate-portal';

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  userId?: string
): boolean {
  if (typeof window === 'undefined' || !posthog) {
    // Default: disable semua fitur berisiko di server-side
    return false;
  }

  // Check feature flag dari PostHog
  return posthog.isFeatureEnabled(flag) ?? false;
}

/**
 * Get feature flag value (untuk gradual rollout)
 */
export function getFeatureFlag(
  flag: FeatureFlag,
  userId?: string
): string | boolean {
  if (typeof window === 'undefined' || !posthog) {
    return false;
  }

  return posthog.getFeatureFlag(flag) ?? false;
}

/**
 * Track feature flag exposure
 */
export function trackFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window === 'undefined' || !posthog) return;

  posthog.capture('feature_flag_exposed', {
    flag_name: flag,
    enabled,
  });
}

