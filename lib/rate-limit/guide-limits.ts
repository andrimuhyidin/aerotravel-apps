/**
 * Rate Limit Configurations for Guide App
 * 
 * Prevents abuse of AI endpoints and file uploads
 * Based on security audit recommendations
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '@/lib/env';

// Initialize Redis client (with fallback for development)
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limit configurations
export const guideRateLimitConfig = {
  ai: { limit: 10, window: '1m' as const },       // AI endpoints: 10 requests/min
  upload: { limit: 5, window: '1m' as const },    // File uploads: 5 uploads/min
  sos: { limit: 3, window: '1h' as const },       // Emergency SOS: 3/hour
  push: { limit: 20, window: '1m' as const },     // Push notifications: 20/min
  ocr: { limit: 5, window: '1m' as const },       // OCR processing: 5/min
} as const;

/**
 * AI Endpoints Rate Limiter
 * 10 requests per minute per user
 * Used for: voice commands, route optimization, sentiment analysis, etc.
 */
export const guideAiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(guideRateLimitConfig.ai.limit, guideRateLimitConfig.ai.window),
      analytics: true,
      prefix: '@upstash/ratelimit/guide-ai',
    })
  : null;

/**
 * File Upload Rate Limiter
 * 5 uploads per minute per user
 * Used for: documents, photos, certifications, incidents
 */
export const guideUploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(guideRateLimitConfig.upload.limit, guideRateLimitConfig.upload.window),
      analytics: true,
      prefix: '@upstash/ratelimit/guide-upload',
    })
  : null;

/**
 * SOS Emergency Rate Limiter
 * 3 triggers per hour per user
 * Prevents accidental spam while allowing legitimate emergencies
 */
export const guideSosRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(guideRateLimitConfig.sos.limit, guideRateLimitConfig.sos.window),
      analytics: true,
      prefix: '@upstash/ratelimit/guide-sos',
    })
  : null;

/**
 * Push Notification Rate Limiter
 * 20 subscriptions per minute per user
 */
export const guidePushRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(guideRateLimitConfig.push.limit, guideRateLimitConfig.push.window),
      analytics: true,
      prefix: '@upstash/ratelimit/guide-push',
    })
  : null;

/**
 * OCR Rate Limiter (more restricted due to higher cost)
 * 5 scans per minute per user
 */
export const guideOcrRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(guideRateLimitConfig.ocr.limit, guideRateLimitConfig.ocr.window),
      analytics: true,
      prefix: '@upstash/ratelimit/guide-ocr',
    })
  : null;

/**
 * Helper function to check rate limit and return appropriate response
 */
export async function checkGuideRateLimit(
  rateLimiter: Ratelimit | null,
  identifier: string,
  limitName: string = 'requests'
): Promise<{ success: boolean; remaining: number; reset: number; error?: string }> {
  // Skip rate limiting if Redis is not configured (development mode)
  if (!rateLimiter) {
    return { success: true, remaining: 999, reset: 0 };
  }

  try {
    const result = await rateLimiter.limit(identifier);
    
    if (!result.success) {
      const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);
      return {
        success: false,
        remaining: result.remaining,
        reset: resetInSeconds,
        error: `Terlalu banyak ${limitName}. Coba lagi dalam ${resetInSeconds} detik.`,
      };
    }

    return {
      success: true,
      remaining: result.remaining,
      reset: 0,
    };
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error('Rate limit check failed:', error);
    return { success: true, remaining: 0, reset: 0 };
  }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(remaining: number, reset: number): HeadersInit {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

