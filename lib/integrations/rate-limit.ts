/**
 * Rate Limit Configurations for Integrations
 *
 * Values are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { DEFAULT_RATE_LIMITS } from '@/lib/settings/rate-limits';

// Initialize Redis with fallback
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiter untuk AI Chat (10 requests per minute per user)
// @deprecated Use createAiChatRateLimiter() for dynamic values
export const aiChatRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        DEFAULT_RATE_LIMITS.aiChat.limit,
        DEFAULT_RATE_LIMITS.aiChat.window as '1 m'
      ),
      analytics: true,
      prefix: '@upstash/ratelimit/ai-chat',
    })
  : null;

// Rate limiter untuk API umum (100 requests per 5 minutes per IP)
// @deprecated Use createApiRateLimiter() for dynamic values
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        DEFAULT_RATE_LIMITS.generalApi.limit,
        DEFAULT_RATE_LIMITS.generalApi.window as '5 m'
      ),
      analytics: true,
      prefix: '@upstash/ratelimit/api',
    })
  : null;

// Rate limiter untuk payment verification (5 requests per minute per user)
// @deprecated Use createPaymentRateLimiter() for dynamic values
export const paymentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        DEFAULT_RATE_LIMITS.payment.limit,
        DEFAULT_RATE_LIMITS.payment.window as '1 m'
      ),
      analytics: true,
      prefix: '@upstash/ratelimit/payment',
    })
  : null;

// Rate limiter untuk chat messages (10 messages per minute per user)
// @deprecated Use createChatRateLimiter() for dynamic values
export const chatRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        DEFAULT_RATE_LIMITS.aiChat.limit,
        DEFAULT_RATE_LIMITS.aiChat.window as '1 m'
      ),
      analytics: true,
      prefix: '@upstash/ratelimit/chat',
    })
  : null;

/**
 * Get integration rate limit settings from database
 */
export async function getIntegrationRateLimitSettings() {
  const { getRateLimitSettings } = await import('@/lib/settings/rate-limits');
  const settings = await getRateLimitSettings();
  return {
    aiChat: settings.aiChat,
    generalApi: settings.generalApi,
    payment: settings.payment,
  };
}

/**
 * Helper to check rate limit with null safety
 */
export async function checkRateLimitSafe(
  rateLimiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number }> {
  if (!rateLimiter) {
    // If Redis is not configured, allow all requests
    return { success: true };
  }

  try {
    const result = await rateLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
    };
  } catch {
    // If rate limiting fails, allow the request
    return { success: true };
  }
}

