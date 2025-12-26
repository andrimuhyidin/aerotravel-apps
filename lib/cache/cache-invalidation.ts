/**
 * Cache Invalidation Utilities
 * Centralized cache invalidation untuk cross-app data changes
 */

import 'server-only';

import { invalidateCache } from './redis-cache';
import { invalidateAvailabilityCache } from './package-availability-cache';
import { logger } from '@/lib/utils/logger';

/**
 * Invalidate caches related to booking changes
 */
export async function invalidateBookingCaches(bookingId: string): Promise<void> {
  try {
    // Invalidate booking-specific caches
    await invalidateCache(`booking:${bookingId}:*`);
    await invalidateCache(`bookings:user:*`); // User booking lists
    await invalidateCache(`bookings:partner:*`); // Partner booking lists
    await invalidateCache(`bookings:admin:*`); // Admin booking lists

    logger.debug('[Cache Invalidation] Invalidated booking caches', { bookingId });
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate booking caches', error, {
      bookingId,
    });
  }
}

/**
 * Invalidate caches related to package changes
 */
export async function invalidatePackageCaches(
  packageId: string,
  options?: {
    invalidateAvailability?: boolean;
    dateRange?: { start: string; end: string };
  }
): Promise<void> {
  try {
    // Invalidate package-specific caches
    await invalidateCache(`package:${packageId}:*`);
    await invalidateCache(`packages:list:*`); // Package lists

    // Invalidate availability if requested
    if (options?.invalidateAvailability) {
      if (options.dateRange) {
        await invalidateAvailabilityCache(packageId);
        // Also invalidate specific date range if provided
        // (This will be handled by invalidateAvailabilityCacheRange if needed)
      } else {
        await invalidateAvailabilityCache(packageId);
      }
    }

    logger.debug('[Cache Invalidation] Invalidated package caches', {
      packageId,
      options,
    });
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate package caches', error, {
      packageId,
    });
  }
}

/**
 * Invalidate caches related to trip changes
 */
export async function invalidateTripCaches(tripId: string): Promise<void> {
  try {
    // Invalidate trip-specific caches
    await invalidateCache(`trip:${tripId}:*`);
    await invalidateCache(`trips:guide:*`); // Guide trip lists
    await invalidateCache(`trips:admin:*`); // Admin trip lists

    logger.debug('[Cache Invalidation] Invalidated trip caches', { tripId });
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate trip caches', error, { tripId });
  }
}

/**
 * Invalidate caches related to wallet changes
 */
export async function invalidateWalletCaches(
  userId: string,
  walletType: 'partner' | 'guide'
): Promise<void> {
  try {
    // Invalidate wallet-specific caches
    await invalidateCache(`${walletType}:wallet:${userId}:*`);
    await invalidateCache(`${walletType}:wallet:transactions:${userId}:*`);

    logger.debug('[Cache Invalidation] Invalidated wallet caches', { userId, walletType });
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate wallet caches', error, {
      userId,
      walletType,
    });
  }
}

/**
 * Invalidate caches related to user changes
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  try {
    // Invalidate user-specific caches
    await invalidateCache(`user:${userId}:*`);
    await invalidateCache(`notifications:${userId}:*`); // User notifications

    logger.debug('[Cache Invalidation] Invalidated user caches', { userId });
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate user caches', error, { userId });
  }
}

/**
 * Invalidate all caches (use with caution)
 */
export async function invalidateAllCaches(): Promise<void> {
  try {
    await invalidateCache('*');
    logger.warn('[Cache Invalidation] Invalidated all caches');
  } catch (error) {
    logger.error('[Cache Invalidation] Failed to invalidate all caches', error);
  }
}

