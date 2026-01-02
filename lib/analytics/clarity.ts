/**
 * Microsoft Clarity Integration
 * Session recording, heatmaps, and user behavior analytics
 */

'use client';

// Global Clarity type declaration
declare global {
  interface Window {
    clarity: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Initialize Microsoft Clarity
 * Called automatically by ClarityScript component
 */
export function initClarity(projectId: string): void {
  if (typeof window === 'undefined') return;

  // Clarity initialization script
  (function (
    c: Window,
    l: Document,
    a: string,
    r: string,
    i: string,
    t?: HTMLScriptElement,
    y?: Element
  ) {
    c[a as keyof Window] =
      c[a as keyof Window] ||
      function (...args: unknown[]) {
        ((c[a as keyof Window] as { q?: unknown[] }).q =
          (c[a as keyof Window] as { q?: unknown[] }).q || []).push(args);
      };
    t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', projectId);
}

/**
 * Identify user in Clarity
 * Links sessions to a specific user ID
 */
export function clarityIdentify(
  userId: string,
  sessionId?: string,
  pageId?: string
): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    window.clarity('identify', userId, sessionId, pageId);
  } catch {
    // Silent fail - analytics should never block user flow
  }
}

/**
 * Set custom tag in Clarity
 * Tags appear in Clarity dashboard for filtering
 */
export function claritySetTag(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    window.clarity('set', key, value);
  } catch {
    // Silent fail
  }
}

/**
 * Upgrade session priority in Clarity
 * Marks current session as important for analysis
 */
export function clarityUpgrade(reason: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    window.clarity('upgrade', reason);
  } catch {
    // Silent fail
  }
}

/**
 * Track consent status
 * For GDPR compliance
 */
export function clarityConsent(hasConsent: boolean = true): void {
  if (typeof window === 'undefined' || !window.clarity) return;

  try {
    window.clarity('consent', hasConsent);
  } catch {
    // Silent fail
  }
}

/**
 * Set funnel step tag
 * For tracking user journey through conversion funnel
 */
export function claritySetFunnelStep(step: string): void {
  claritySetTag('funnel_step', step);
}

/**
 * Set user type tag
 * For segmenting by user type
 */
export function claritySetUserType(
  userType: 'guest' | 'customer' | 'partner' | 'guide' | 'admin'
): void {
  claritySetTag('user_type', userType);
}

/**
 * Set page category tag
 * For analyzing behavior by page type
 */
export function claritySetPageCategory(category: string): void {
  claritySetTag('page_category', category);
}

/**
 * Tag important conversion events
 * Automatically upgrades session for analysis
 */
export function clarityTrackConversion(conversionType: string, value?: number): void {
  claritySetTag('conversion_type', conversionType);
  if (value !== undefined) {
    claritySetTag('conversion_value', value.toString());
  }
  clarityUpgrade(`conversion_${conversionType}`);
}

/**
 * Tag error occurrence
 * Marks session for debugging
 */
export function clarityTrackError(errorType: string, errorMessage: string): void {
  claritySetTag('error_type', errorType);
  claritySetTag('error_message', errorMessage.substring(0, 100)); // Limit length
  clarityUpgrade(`error_${errorType}`);
}

/**
 * Check if Clarity is available
 */
export function isClarityAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.clarity === 'function';
}

