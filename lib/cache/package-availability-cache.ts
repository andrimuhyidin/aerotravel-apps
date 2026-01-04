/**
 * Package Availability Cache Layer
 * Caching service untuk package availability dengan Redis
 */

import 'server-only';

import { getCache, invalidateCache, setCache } from './redis-cache';
import { logger } from '@/lib/utils/logger';

export type Availability = {
  date: string;
  isAvailable: boolean;
  availableSlots: number;
  currentPax: number;
  maxCapacity: number;
  hasOpenTrip: boolean;
};

export type AvailabilitySummary = {
  packageId: string;
  packageName: string;
  dateRange: {
    start: string;
    end: string;
  };
  maxCapacityPerDate: number;
  availability: Availability[];
  summary: {
    totalDates: number;
    availableDates: number;
    datesWithOpenTrips: number;
  };
};

/**
 * Get cached availability atau calculate dan cache
 * @param packageId - Package ID
 * @param date - Date string (YYYY-MM-DD)
 * @param minPax - Minimum pax required
 * @param fetcher - Function untuk calculate availability jika cache miss
 * @returns Availability data
 */
export async function getCachedAvailability(
  packageId: string,
  date: string,
  minPax: number,
  fetcher: () => Promise<Availability>
): Promise<Availability> {
  const cacheKey = `availability:package:${packageId}:date:${date}:minPax:${minPax}`;
  const ttl = 300; // 5 minutes

  try {
    // Try to get from cache
    const cached = await getCache<Availability>(cacheKey);
    if (cached) {
      logger.debug('[Availability Cache] Cache hit', { packageId, date, minPax });
      return cached;
    }

    // Cache miss - fetch and cache
    logger.debug('[Availability Cache] Cache miss', { packageId, date, minPax });
    const availability = await fetcher();
    await setCache(cacheKey, availability, ttl);

    return availability;
  } catch (error) {
    logger.error('[Availability Cache] Error', error, { packageId, date, minPax });
    // Fallback to direct fetch
    return fetcher();
  }
}

/**
 * Get cached availability summary untuk date range
 * @param packageId - Package ID
 * @param dateRange - Date range (start and end dates)
 * @param minPax - Minimum pax required
 * @param fetcher - Function untuk calculate summary jika cache miss
 * @returns Availability summary
 */
export async function getCachedAvailabilitySummary(
  packageId: string,
  dateRange: { start: string; end: string },
  minPax: number,
  fetcher: () => Promise<AvailabilitySummary>
): Promise<AvailabilitySummary> {
  const cacheKey = `availability:summary:package:${packageId}:start:${dateRange.start}:end:${dateRange.end}:minPax:${minPax}`;
  const ttl = 300; // 5 minutes

  try {
    // Try to get from cache
    const cached = await getCache<AvailabilitySummary>(cacheKey);
    if (cached) {
      logger.debug('[Availability Cache] Summary cache hit', {
        packageId,
        dateRange,
        minPax,
      });
      return cached;
    }

    // Cache miss - fetch and cache
    logger.debug('[Availability Cache] Summary cache miss', {
      packageId,
      dateRange,
      minPax,
    });
    const summary = await fetcher();
    await setCache(cacheKey, summary, ttl);

    return summary;
  } catch (error) {
    logger.error('[Availability Cache] Summary error', error, {
      packageId,
      dateRange,
      minPax,
    });
    // Fallback to direct fetch
    return fetcher();
  }
}

/**
 * Invalidate availability cache untuk specific package and date
 * @param packageId - Package ID
 * @param date - Date string (YYYY-MM-DD), optional (if not provided, invalidate all dates for package)
 */
export async function invalidateAvailabilityCache(
  packageId: string,
  date?: string
): Promise<void> {
  try {
    if (date) {
      // Invalidate specific date
      const pattern = `availability:package:${packageId}:date:${date}:*`;
      await invalidateCache(pattern);
      logger.debug('[Availability Cache] Invalidated specific date', { packageId, date });
    } else {
      // Invalidate all dates for package
      const pattern = `availability:package:${packageId}:*`;
      await invalidateCache(pattern);
      // Also invalidate summaries
      const summaryPattern = `availability:summary:package:${packageId}:*`;
      await invalidateCache(summaryPattern);
      logger.debug('[Availability Cache] Invalidated all dates for package', { packageId });
    }
  } catch (error) {
    logger.error('[Availability Cache] Invalidation error', error, { packageId, date });
  }
}

/**
 * Invalidate availability cache untuk date range
 * Useful saat booking dibuat untuk date range tertentu
 */
export async function invalidateAvailabilityCacheRange(
  packageId: string,
  dateRange: { start: string; end: string }
): Promise<void> {
  try {
    // Invalidate all dates in range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const dates: string[] = [];

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(date.toISOString().split('T')[0]!);
    }

    // Invalidate each date
    for (const date of dates) {
      await invalidateAvailabilityCache(packageId, date);
    }

    // Also invalidate summaries that might include this range
    const summaryPattern = `availability:summary:package:${packageId}:*`;
    await invalidateCache(summaryPattern);

    logger.debug('[Availability Cache] Invalidated date range', {
      packageId,
      dateRange,
      datesCount: dates.length,
    });
  } catch (error) {
    logger.error('[Availability Cache] Range invalidation error', error, {
      packageId,
      dateRange,
    });
  }
}

/**
 * Invalidate all availability caches
 * Use with caution - only for admin operations
 */
export async function invalidateAllAvailabilityCache(): Promise<void> {
  try {
    await invalidateCache('availability:*');
    logger.info('[Availability Cache] Invalidated all availability caches');
  } catch (error) {
    logger.error('[Availability Cache] Failed to invalidate all', error);
  }
}

/**
 * Batch get cached availability untuk multiple packages/dates
 * Optimized untuk reduce Redis round trips
 */
export async function getBatchCachedAvailability(
  requests: Array<{
    packageId: string;
    date: string;
    minPax: number;
  }>,
  fetcher: (request: typeof requests[0]) => Promise<Availability>
): Promise<Array<{ request: typeof requests[0]; availability: Availability }>> {
  const results: Array<{ request: typeof requests[0]; availability: Availability }> = [];

  // Process in parallel batches of 10
  const batchSize = 10;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchPromises = batch.map(async (req) => {
      const availability = await getCachedAvailability(
        req.packageId,
        req.date,
        req.minPax,
        () => fetcher(req)
      );
      return { request: req, availability };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

