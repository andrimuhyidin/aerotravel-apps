/**
 * Cookie Preferences Management
 * Utilities untuk manage user cookie consent preferences
 */

export type CookiePreferences = {
  necessary: boolean;  // Always true, cannot be disabled
  analytics: boolean;  // GA4, PostHog, Clarity
  marketing: boolean;  // Marketing/advertising cookies
};

const COOKIE_CONSENT_KEY = 'aero-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'aero-cookie-preferences';

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
}

/**
 * Get current cookie preferences
 */
export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  }

  const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!stored) {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  }

  try {
    const parsed = JSON.parse(stored) as CookiePreferences;
    return {
      necessary: true, // Always true
      analytics: parsed.analytics ?? false,
      marketing: parsed.marketing ?? false,
    };
  } catch {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  }
}

/**
 * Save cookie preferences
 */
export function saveCookiePreferences(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
  localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({
    necessary: true, // Always true
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  }));

  // Trigger custom event for components to react to consent changes
  window.dispatchEvent(new CustomEvent('cookieConsentChange', {
    detail: preferences,
  }));
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  saveCookiePreferences({
    necessary: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Reject all non-necessary cookies
 */
export function rejectAllCookies(): void {
  saveCookiePreferences({
    necessary: true,
    analytics: false,
    marketing: false,
  });
}

/**
 * Revoke consent (for settings page)
 */
export function revokeConsent(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  
  window.dispatchEvent(new CustomEvent('cookieConsentChange', {
    detail: {
      necessary: true,
      analytics: false,
      marketing: false,
    },
  }));
}

