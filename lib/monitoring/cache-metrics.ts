/**
 * Cache Performance Metrics
 * Track cache hit/miss rates and performance
 */

import 'server-only';

import { logger } from '@/lib/utils/logger';

// In-memory metrics (should be stored in Redis for production)
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0,
  errors: 0,
};

/**
 * Record cache hit
 */
export function recordCacheHit(): void {
  cacheMetrics.hits++;
}

/**
 * Record cache miss
 */
export function recordCacheMiss(): void {
  cacheMetrics.misses++;
}

/**
 * Record cache set
 */
export function recordCacheSet(): void {
  cacheMetrics.sets++;
}

/**
 * Record cache invalidation
 */
export function recordCacheInvalidation(): void {
  cacheMetrics.invalidations++;
}

/**
 * Record cache error
 */
export function recordCacheError(): void {
  cacheMetrics.errors++;
}

/**
 * Get cache metrics
 */
export function getCacheMetrics(): {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  errors: number;
  hitRate: number;
  totalRequests: number;
} {
  const totalRequests = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = totalRequests > 0 ? (cacheMetrics.hits / totalRequests) * 100 : 0;

  return {
    ...cacheMetrics,
    hitRate: Math.round(hitRate * 100) / 100,
    totalRequests,
  };
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics(): void {
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.sets = 0;
  cacheMetrics.invalidations = 0;
  cacheMetrics.errors = 0;
  logger.info('[Cache Metrics] Metrics reset');
}

