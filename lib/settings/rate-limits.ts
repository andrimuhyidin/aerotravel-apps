/**
 * Rate Limit Settings - Configurable rate limit values
 *
 * These values are fetched from database settings table
 * with fallback to default constants
 */

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
  limit: number;
  window: string; // '1m', '5m', '1h', etc.
}

export interface AllRateLimitSettings {
  guideAi: RateLimitConfig;
  guideUpload: RateLimitConfig;
  guideSos: RateLimitConfig;
  guideOcr: RateLimitConfig;
  guidePush: RateLimitConfig;
  publicPost: RateLimitConfig;
  publicGet: RateLimitConfig;
  publicAi: RateLimitConfig;
  aiChat: RateLimitConfig;
  payment: RateLimitConfig;
  generalApi: RateLimitConfig;
}

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

export const DEFAULT_RATE_LIMITS: AllRateLimitSettings = {
  guideAi: { limit: 10, window: '1m' },
  guideUpload: { limit: 5, window: '1m' },
  guideSos: { limit: 3, window: '1h' },
  guideOcr: { limit: 5, window: '1m' },
  guidePush: { limit: 20, window: '1m' },
  publicPost: { limit: 10, window: '1m' },
  publicGet: { limit: 100, window: '1m' },
  publicAi: { limit: 5, window: '1m' },
  aiChat: { limit: 10, window: '1m' },
  payment: { limit: 5, window: '1m' },
  generalApi: { limit: 100, window: '5m' },
};

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Get all rate limit settings from database with fallback to defaults
 */
export async function getRateLimitSettings(): Promise<AllRateLimitSettings> {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [
      guideAi,
      guideUpload,
      guideSos,
      guideOcr,
      guidePush,
      publicPost,
      publicGet,
      publicAi,
      aiChat,
      payment,
      generalApi,
    ] = await Promise.all([
      getSetting('rate_limits.guide_ai'),
      getSetting('rate_limits.guide_upload'),
      getSetting('rate_limits.guide_sos'),
      getSetting('rate_limits.guide_ocr'),
      getSetting('rate_limits.guide_push'),
      getSetting('rate_limits.public_post'),
      getSetting('rate_limits.public_get'),
      getSetting('rate_limits.public_ai'),
      getSetting('rate_limits.ai_chat'),
      getSetting('rate_limits.payment'),
      getSetting('rate_limits.general_api'),
    ]);

    return {
      guideAi: (guideAi as RateLimitConfig) || DEFAULT_RATE_LIMITS.guideAi,
      guideUpload:
        (guideUpload as RateLimitConfig) || DEFAULT_RATE_LIMITS.guideUpload,
      guideSos: (guideSos as RateLimitConfig) || DEFAULT_RATE_LIMITS.guideSos,
      guideOcr: (guideOcr as RateLimitConfig) || DEFAULT_RATE_LIMITS.guideOcr,
      guidePush:
        (guidePush as RateLimitConfig) || DEFAULT_RATE_LIMITS.guidePush,
      publicPost:
        (publicPost as RateLimitConfig) || DEFAULT_RATE_LIMITS.publicPost,
      publicGet:
        (publicGet as RateLimitConfig) || DEFAULT_RATE_LIMITS.publicGet,
      publicAi: (publicAi as RateLimitConfig) || DEFAULT_RATE_LIMITS.publicAi,
      aiChat: (aiChat as RateLimitConfig) || DEFAULT_RATE_LIMITS.aiChat,
      payment: (payment as RateLimitConfig) || DEFAULT_RATE_LIMITS.payment,
      generalApi:
        (generalApi as RateLimitConfig) || DEFAULT_RATE_LIMITS.generalApi,
    };
  } catch {
    return DEFAULT_RATE_LIMITS;
  }
}

/**
 * Get specific rate limit setting
 */
export async function getRateLimitConfig(
  key: keyof AllRateLimitSettings
): Promise<RateLimitConfig> {
  const settings = await getRateLimitSettings();
  return settings[key];
}

/**
 * Parse window string to milliseconds
 * e.g., '1m' -> 60000, '1h' -> 3600000, '5m' -> 300000
 */
export function parseWindowToMs(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) return 60000; // default 1 minute

  const value = parseInt(match[1] || '1', 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

/**
 * Parse window string to Ratelimit window format
 * Returns the window as-is since Ratelimit accepts string format
 */
export function parseWindowToRatelimitFormat(
  window: string
): '1 s' | '1 m' | '5 m' | '1 h' {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) return '1 m'; // default 1 minute

  const value = match[1];
  const unit = match[2];

  switch (unit) {
    case 's':
      return `${value} s` as '1 s';
    case 'm':
      return `${value} m` as '1 m';
    case 'h':
      return `${value} h` as '1 h';
    default:
      return '1 m';
  }
}

