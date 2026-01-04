/**
 * Public API Rate Limiter
 * Simple in-memory rate limiter for public endpoints
 *
 * Values are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

import { DEFAULT_RATE_LIMITS, parseWindowToMs } from '@/lib/settings/rate-limits';

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

// Default configs (sync, use getPublicRateLimitConfigs() for dynamic values)
// @deprecated Use getPublicRateLimitConfigs() for dynamic values
export const RATE_LIMIT_CONFIGS = {
  POST: {
    windowMs: parseWindowToMs(DEFAULT_RATE_LIMITS.publicPost.window),
    maxRequests: DEFAULT_RATE_LIMITS.publicPost.limit,
  },
  GET: {
    windowMs: parseWindowToMs(DEFAULT_RATE_LIMITS.publicGet.window),
    maxRequests: DEFAULT_RATE_LIMITS.publicGet.limit,
  },
  AI: {
    windowMs: parseWindowToMs(DEFAULT_RATE_LIMITS.publicAi.window),
    maxRequests: DEFAULT_RATE_LIMITS.publicAi.limit,
  },
} as const;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.GET
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { success: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}

export function getRequestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return (
    forwardedFor?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get public rate limit configs from settings (async)
 */
export async function getPublicRateLimitConfigs(): Promise<
  Record<'POST' | 'GET' | 'AI', RateLimitConfig>
> {
  try {
    const { getRateLimitSettings, parseWindowToMs } = await import(
      '@/lib/settings/rate-limits'
    );
    const settings = await getRateLimitSettings();

    return {
      POST: {
        windowMs: parseWindowToMs(settings.publicPost.window),
        maxRequests: settings.publicPost.limit,
      },
      GET: {
        windowMs: parseWindowToMs(settings.publicGet.window),
        maxRequests: settings.publicGet.limit,
      },
      AI: {
        windowMs: parseWindowToMs(settings.publicAi.window),
        maxRequests: settings.publicAi.limit,
      },
    };
  } catch {
    return RATE_LIMIT_CONFIGS;
  }
}

