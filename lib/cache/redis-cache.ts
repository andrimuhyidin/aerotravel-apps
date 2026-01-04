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
 * Check if running in static generation context
 * During Next.js static generation, external fetches with no-store are blocked
 */
function isStaticGeneration(): boolean {
  // During build/static generation, certain headers/features aren't available
  // We can detect this by checking the environment
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * Get cached data or fetch and cache
 * @param key Cache key
 * @param ttl Time to live in seconds
 * @param fetcher Function to fetch data if cache miss
 * @returns Cached or fresh data
 * 
 * NOTE: Upstash Redis SDK auto-deserializes JSON, so we receive objects directly.
 * We handle both cases for compatibility.
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Skip cache during static generation to avoid no-store fetch errors
  if (isStaticGeneration()) {
    return fetcher();
  }

  const redis = getRedisClient();

  // If Redis is not available, just fetch
  if (!redis) {
    return fetcher();
  }

  try {
    // Try to get from cache
    // Upstash Redis SDK auto-deserializes JSON, so we request as T directly
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      logger.debug('Cache hit', { key });
      
      // Upstash SDK auto-deserializes JSON, so cached is already an object
      // This is the expected behavior - no need to parse
      if (typeof cached === 'object') {
        return cached as T;
      }
      
      // Fallback for string values (should rarely happen)
      if (typeof cached === 'string') {
        try {
          return JSON.parse(cached) as T;
        } catch {
          // If parsing fails, return as-is for string types
          return cached as unknown as T;
        }
      }
      
      // For primitive types (number, boolean), return as-is
      return cached as T;
    }

    // Cache miss - fetch and cache
    logger.debug('Cache miss', { key });
    const data = await fetcher();

    // Set cache with TTL - Upstash auto-serializes objects
    await redis.setex(key, ttl, data as unknown as string);

    return data;
  } catch (error) {
    // If cache fails, still return fetched data
    // Use warn instead of error since fallback is expected behavior
    logger.warn('Cache unavailable, using direct fetch', { key });
    return fetcher();
  }
}

/**
 * Set cache value manually
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds
 * 
 * NOTE: Upstash Redis SDK auto-serializes objects
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Upstash auto-serializes objects, so we can pass value directly
    await redis.setex(key, ttl, value as unknown as string);
  } catch {
    // Silent fail for cache set - not critical
    logger.debug('Cache set skipped', { key });
  }
}

/**
 * Get cache value without fetching
 * @param key Cache key
 * @returns Cached value or null
 * 
 * NOTE: Upstash Redis SDK auto-deserializes JSON
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    // Upstash auto-deserializes JSON, so we get T directly
    const cached = await redis.get<T>(key);
    if (cached === null || cached === undefined) return null;

    // Upstash SDK returns the deserialized value directly
    if (typeof cached === 'object') {
      return cached as T;
    }
    
    // For string values, try to parse as JSON
    if (typeof cached === 'string') {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // If parsing fails, return as-is for string types
        return cached as unknown as T;
      }
    }
    
    // For primitive types, return as-is
    return cached as T;
  } catch {
    // Silent fail for cache get - not critical
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
  } catch {
    // Silent fail for cache invalidate - not critical
    logger.debug('Cache invalidate skipped', { key });
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
 * Invalidate unified metrics cache for a guide
 * @param userId Guide ID
 * @param period Optional period to invalidate specific cache
 */
export async function invalidateUnifiedMetricsCache(
  userId: string,
  period?: string
): Promise<void> {
  if (period) {
    await invalidateCache(`guide:metrics:unified:${userId}:${period}*`);
  } else {
    await invalidateCache(`guide:metrics:unified:${userId}:*`);
  }
}

/**
 * Invalidate unified AI insights cache for a guide
 * @param userId Guide ID
 * @param period Optional period to invalidate specific cache
 */
export async function invalidateUnifiedAIInsightsCache(
  userId: string,
  period?: string
): Promise<void> {
  if (period) {
    await invalidateCache(`guide:ai:insights:unified:${userId}:${period}*`);
  } else {
    await invalidateCache(`guide:ai:insights:unified:${userId}:*`);
  }
}

/**
 * Invalidate all unified caches for a guide (metrics + AI insights)
 * Call this when trip completed, review added, or wallet transaction
 * @param userId Guide ID
 */
export async function invalidateGuideUnifiedCaches(
  userId: string
): Promise<void> {
  await invalidateUnifiedMetricsCache(userId);
  await invalidateUnifiedAIInsightsCache(userId);
}

/**
 * Cache key builders
 */
export const cacheKeys = {
  // User session cache (PERFORMANCE - reduces DB queries)
  user: {
    session: (userId: string) => `user:session:${userId}`,
    fullData: (userId: string) => `user:${userId}:full`,
    activeRole: (userId: string) => `user:role:${userId}`,
    roles: (userId: string) => `user:roles:${userId}`,
    profile: (userId: string) => `user:profile:${userId}`,
  },
  // Admin dashboard cache
  admin: {
    dashboard: (userId: string) => `admin:dashboard:${userId}`,
  },
  // Guide-specific cache
  guide: {
    stats: (userId: string) => `guide:stats:${userId}`,
    trips: (userId: string, status?: string) =>
      status ? `guide:trips:${userId}:${status}` : `guide:trips:${userId}`,
    dashboard: (userId: string) => `guide:dashboard:${userId}`,
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
    unifiedMetrics: (userId: string, period: string) =>
      `guide:metrics:unified:${userId}:${period}`,
    unifiedAIInsights: (userId: string, period: string) =>
      `guide:ai:insights:unified:${userId}:${period}`,
  },
} as const;

/**
 * Default TTL values (in seconds)
 */
export const cacheTTL = {
  // User session cache
  userSession: 300, // 5 minutes
  userRole: 300, // 5 minutes (roles rarely change)
  userProfile: 300, // 5 minutes
  // Admin cache
  adminDashboard: 60, // 1 minute
  // Guide cache
  stats: 300, // 5 minutes
  trips: 120, // 2 minutes
  wallet: 60, // 1 minute
  leaderboard: 300, // 5 minutes
  performance: 300, // 5 minutes
  insights: 600, // 10 minutes
  analytics: 600, // 10 minutes
  feedbackAnalytics: 300, // 5 minutes
  unifiedMetrics: 300, // 5 minutes
  unifiedAIInsights: 600, // 10 minutes (AI is expensive)
} as const;

/**
 * Warm user cache on login
 * Pre-cache user data to speed up first page load
 * 
 * NOTE: Upstash Redis SDK auto-serializes objects
 */
export async function warmUserCache(
  userId: string,
  profile: Record<string, unknown> | null,
  activeRole: string | null,
  roles: string[]
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await Promise.all([
      // Cache profile - Upstash auto-serializes
      profile
        ? redis.setex(
            cacheKeys.user.profile(userId),
            cacheTTL.userProfile,
            profile as unknown as string
          )
        : Promise.resolve(),
      // Cache active role - string doesn't need serialization
      activeRole
        ? redis.setex(
            cacheKeys.user.activeRole(userId),
            cacheTTL.userRole,
            activeRole
          )
        : Promise.resolve(),
      // Cache all roles - Upstash auto-serializes arrays
      roles.length > 0
        ? redis.setex(
            cacheKeys.user.roles(userId),
            cacheTTL.userRole,
            roles as unknown as string
          )
        : Promise.resolve(),
    ]);
    logger.debug('User cache warmed', { userId });
  } catch {
    // Silent fail for cache warm - not critical
    logger.debug('User cache warm skipped', { userId });
  }
}
