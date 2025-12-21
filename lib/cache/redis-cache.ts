/**
 * Redis Cache Utility
 * Server-side caching layer untuk expensive queries
 * Uses Upstash Redis
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

// Reuse Redis instance from rate-limit (same connection)
// Import the redis instance used by rate limiter to share connection
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis env vars are available
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Silently return null if not configured (graceful degradation)
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client for cache', error);
    return null;
  }
}

/**
 * Get cached data or fetch and cache
 * @param key Cache key
 * @param ttl Time to live in seconds
 * @param fetcher Function to fetch data if cache miss
 * @returns Cached or fresh data
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();
  
  // If Redis is not available, just fetch
  if (!redis) {
    return fetcher();
  }

  try {
    // Try to get from cache
    const cached = await redis.get<string>(key);
    if (cached !== null && cached !== undefined) {
      logger.debug('Cache hit', { key });
      try {
        return JSON.parse(cached) as T;
      } catch (parseError) {
        logger.error('Failed to parse cached data', parseError, { key });
        // If parsing fails, invalidate cache and fetch fresh
        await redis.del(key);
        const data = await fetcher();
        await redis.setex(key, ttl, JSON.stringify(data));
        return data;
      }
    }

    // Cache miss - fetch and cache
    logger.debug('Cache miss', { key });
    const data = await fetcher();
    
    // Set cache with TTL
    await redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  } catch (error) {
    // If cache fails, still return fetched data
    logger.error('Cache error, falling back to direct fetch', error, { key });
    return fetcher();
  }
}

/**
 * Set cache value manually
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds
 */
export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to set cache', error, { key });
  }
}

/**
 * Get cache value without fetching
 * @param key Cache key
 * @returns Cached value or null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get<string>(key);
    if (cached === null || cached === undefined) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error('Failed to get cache', error, { key });
    return null;
  }
}

/**
 * Invalidate cache by key
 * @param key Cache key (supports wildcards with *)
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // If key contains wildcard, use pattern matching
    if (key.includes('*')) {
      const pattern = key;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(key);
    }
    logger.debug('Cache invalidated', { key });
  } catch (error) {
    logger.error('Failed to invalidate cache', error, { key });
  }
}

/**
 * Invalidate all cache for a user/guide
 * @param userId User ID
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await invalidateCache(`guide:*:${userId}*`);
  await invalidateCache(`user:${userId}:*`);
}

/**
 * Cache key builders
 */
export const cacheKeys = {
  guide: {
    stats: (userId: string) => `guide:stats:${userId}`,
    trips: (userId: string, status?: string) => 
      status ? `guide:trips:${userId}:${status}` : `guide:trips:${userId}`,
    wallet: (userId: string) => `guide:wallet:${userId}`,
    walletTransactions: (userId: string, page: number, limit: number) =>
      `guide:wallet:tx:${userId}:${page}:${limit}`,
    leaderboard: (branchId?: string) =>
      branchId ? `guide:leaderboard:${branchId}` : 'guide:leaderboard:all:',
    performance: (userId: string, period: string) =>
      `guide:performance:${userId}:${period}`,
    insights: (userId: string, month: string) =>
      `guide:insights:${userId}:${month}`,
    feedbackAnalytics: (branchId?: string, period?: string) =>
      branchId && period
        ? `guide:feedback:analytics:${branchId}:${period}`
        : branchId
          ? `guide:feedback:analytics:${branchId}`
          : 'guide:feedback:analytics:all',
    performanceInsights: (userId: string, period: string) =>
      `guide:performance:insights:${userId}:${period}`,
  },
} as const;

/**
 * Default TTL values (in seconds)
 */
export const cacheTTL = {
  stats: 300, // 5 minutes
  trips: 120, // 2 minutes
  wallet: 60, // 1 minute
  leaderboard: 300, // 5 minutes
  performance: 300, // 5 minutes
  insights: 600, // 10 minutes
  analytics: 600, // 10 minutes
  feedbackAnalytics: 300, // 5 minutes
} as const;

