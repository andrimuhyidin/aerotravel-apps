/**
 * Public API Rate Limiter
 * Simple in-memory rate limiter for public endpoints
 */

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

export const RATE_LIMIT_CONFIGS = {
  POST: { windowMs: 60 * 1000, maxRequests: 10 },
  GET: { windowMs: 60 * 1000, maxRequests: 100 },
  AI: { windowMs: 60 * 1000, maxRequests: 5 },
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
  return forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

