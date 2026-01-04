/**
 * Partner Offline Cache Service
 * Cache package list and recent bookings for offline browsing
 */

import { logger } from '@/lib/utils/logger';

const CACHE_PREFIX = 'partner_offline_';
const CACHE_VERSION = 'v1';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  version: string;
};

/**
 * Check if browser supports localStorage
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached data
 */
export function getCachedData<T>(key: string): T | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);

    // Check version
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    // Check expiration (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - entry.timestamp > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    logger.warn('Failed to get cached data', { key, error });
    return null;
  }
}

/**
 * Set cached data
 */
export function setCachedData<T>(key: string, data: T): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    logger.warn('Failed to set cached data', { key, error });
  }
}

/**
 * Clear cached data
 */
export function clearCachedData(key: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    logger.warn('Failed to clear cached data', { key, error });
  }
}

/**
 * Clear all partner cache
 */
export function clearAllPartnerCache(): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    logger.warn('Failed to clear all partner cache', { error });
  }
}

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  PACKAGES: 'packages',
  RECENT_BOOKINGS: 'recent_bookings',
  WALLET_BALANCE: 'wallet_balance',
  DASHBOARD_STATS: 'dashboard_stats',
} as const;

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Queue action for sync when online
 */
export function queueAction(action: {
  type: string;
  payload: unknown;
  timestamp: number;
}): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const queue = getCachedData<Array<typeof action>>('action_queue') || [];
    queue.push(action);
    setCachedData('action_queue', queue);
  } catch (error) {
    logger.warn('Failed to queue action', { error });
  }
}

/**
 * Get queued actions
 */
export function getQueuedActions(): Array<{
  type: string;
  payload: unknown;
  timestamp: number;
}> {
  return getCachedData('action_queue') || [];
}

/**
 * Clear queued actions
 */
export function clearQueuedActions(): void {
  clearCachedData('action_queue');
}

