/**
 * User Identity Sync
 * Syncs user ID across all analytics platforms
 */

'use client';

import { trackEvent } from './analytics';
import { clarityIdentify, claritySetTag, claritySetUserType } from './clarity';
import { logger } from '@/lib/utils/logger';

// ============================================
// Constants
// ============================================

const ANONYMOUS_ID_KEY = 'aero_anonymous_id';
const USER_ID_KEY = 'aero_user_id';

// ============================================
// Types
// ============================================

export type UserType = 'guest' | 'customer' | 'partner' | 'guide' | 'admin';

export type UserIdentity = {
  userId?: string;
  anonymousId: string;
  userType: UserType;
  email?: string;
  name?: string;
  createdAt?: string;
  properties?: Record<string, unknown>;
};

// ============================================
// Anonymous ID Management
// ============================================

/**
 * Get or create anonymous ID
 * Persists across sessions using localStorage
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_anonymous';
  }

  try {
    let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);

    if (!anonymousId) {
      anonymousId = generateAnonymousId();
      localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    }

    return anonymousId;
  } catch {
    // localStorage not available, use session-based ID
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Generate unique anonymous ID
 */
function generateAnonymousId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `anon_${timestamp}_${randomPart}`;
}

// ============================================
// User ID Management
// ============================================

/**
 * Get stored user ID (if logged in)
 */
export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Store user ID (on login)
 */
export function storeUserId(userId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // Storage not available
  }
}

/**
 * Clear user ID (on logout)
 */
export function clearUserId(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // Storage not available
  }
}

// ============================================
// Identity Sync Functions
// ============================================

/**
 * Identify user across all platforms
 * Call on login or when user info becomes available
 */
export function identifyUser(identity: UserIdentity): void {
  const { userId, anonymousId, userType, email, name, properties } = identity;

  // Store user ID
  if (userId) {
    storeUserId(userId);
  }

  // Track identity in GA4/PostHog
  trackEvent('identify' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
    user_type: userType,
    email,
    name,
    ...properties,
  });

  // Sync to Clarity
  if (userId) {
    clarityIdentify(userId);
  }
  claritySetUserType(userType);

  if (email) {
    claritySetTag('user_email_domain', email.split('@')[1] || 'unknown');
  }

  // Set additional user properties in Clarity
  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' || typeof value === 'number') {
        claritySetTag(`user_${key}`, String(value));
      }
    }
  }

  logger.info('User identified', { userId, userType });
}

/**
 * Track login event
 */
export function trackLogin(
  userId: string,
  userType: UserType,
  method: 'email' | 'google' | 'apple' | 'phone' = 'email'
): void {
  const anonymousId = getAnonymousId();

  identifyUser({
    userId,
    anonymousId,
    userType,
  });

  trackEvent('login' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
    method,
    user_type: userType,
  });
}

/**
 * Track logout event
 */
export function trackLogout(): void {
  const userId = getStoredUserId();
  const anonymousId = getAnonymousId();

  trackEvent('logout' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
  });

  clearUserId();

  // Reset Clarity to anonymous
  claritySetUserType('guest');
}

/**
 * Track signup event
 */
export function trackSignup(
  userId: string,
  userType: UserType,
  method: 'email' | 'google' | 'apple' | 'phone' = 'email'
): void {
  const anonymousId = getAnonymousId();

  identifyUser({
    userId,
    anonymousId,
    userType,
  });

  trackEvent('register' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
    method,
    user_type: userType,
  });
}

/**
 * Get current user identity
 */
export function getCurrentIdentity(): UserIdentity {
  const userId = getStoredUserId();
  const anonymousId = getAnonymousId();

  return {
    userId: userId || undefined,
    anonymousId,
    userType: userId ? 'customer' : 'guest', // Default, should be overridden by actual user data
  };
}

/**
 * Check if user is identified (logged in)
 */
export function isUserIdentified(): boolean {
  return getStoredUserId() !== null;
}

/**
 * Update user properties
 */
export function updateUserProperties(properties: Record<string, unknown>): void {
  const userId = getStoredUserId();
  const anonymousId = getAnonymousId();

  trackEvent('user_properties_updated' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
    ...properties,
  });

  // Update Clarity tags
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' || typeof value === 'number') {
      claritySetTag(`user_${key}`, String(value));
    }
  }
}

/**
 * Track user role switch (for multi-role users)
 */
export function trackRoleSwitch(
  fromRole: UserType,
  toRole: UserType
): void {
  const userId = getStoredUserId();
  const anonymousId = getAnonymousId();

  trackEvent('role_switched' as any, {
    user_id: userId,
    anonymous_id: anonymousId,
    from_role: fromRole,
    to_role: toRole,
  });

  claritySetUserType(toRole);
  claritySetTag('previous_role', fromRole);
}

