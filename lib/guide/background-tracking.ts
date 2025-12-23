/**
 * Background GPS Tracking Service for Guide App
 * PRD 6.1.C: Live Tracking (Posisi Armada)
 *
 * Features:
 * - Periodic GPS ping setiap 5-10 menit saat trip ON_TRIP
 * - Battery-aware tracking (reduce frequency saat battery low)
 * - Background service worker support
 * - Fallback untuk browsers yang tidak support
 */

import { logger } from '@/lib/utils/logger';

const TRACKING_INTERVAL_NORMAL = 5 * 60 * 1000; // 5 menit
const TRACKING_INTERVAL_BATTERY_LOW = 10 * 60 * 1000; // 10 menit
const TRACKING_INTERVAL_BACKGROUND = 10 * 60 * 1000; // 10 menit saat background

let trackingInterval: NodeJS.Timeout | null = null;
let isTracking = false;
let currentTripId: string | null = null;
let watchId: number | null = null;

/**
 * Get current battery level (0-1)
 */
function getBatteryLevel(): Promise<number> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery = (navigator as any).getBattery?.();
    if (battery) {
      battery
        .then((batt: { level: number }) => resolve(batt.level))
        .catch(() => resolve(1));
    } else {
      // Fallback: assume full battery
      resolve(1);
    }
  });
}

/**
 * Get current location with high accuracy
 */
async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Send GPS ping to server or queue for offline sync
 */
async function sendTrackingPing(
  tripId: string,
  position: GeolocationPosition
): Promise<void> {
  const { latitude, longitude } = position.coords;
  const accuracyMeters = position.coords.accuracy ?? undefined;
  const altitudeMeters = position.coords.altitude ?? undefined;
  const heading = position.coords.heading ?? undefined;
  const speed = position.coords.speed ? position.coords.speed * 3.6 : undefined; // Convert m/s to km/h

  const payload = {
    tripId,
    latitude,
    longitude,
    accuracyMeters,
    altitudeMeters,
    heading,
    speedKmh: speed,
  };

  // Try to send directly if online
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/guide/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.info('[Tracking] GPS ping sent', {
          tripId,
          latitude,
          longitude,
        });
        return;
      }

      // If response not ok, fall through to queue
      logger.warn('[Tracking] Tracking ping failed, queueing for sync', {
        tripId,
        status: response.status,
      });
    } catch (error) {
      // Network error, fall through to queue
      logger.warn('[Tracking] Network error, queueing for sync', {
        tripId,
        error,
      });
    }
  }

  // Queue for offline sync
  try {
    // Dynamic import to avoid circular dependencies
    const { queueMutation } = await import('./offline-sync');
    await queueMutation('TRACK_POSITION', payload);
    logger.info('[Tracking] GPS ping queued for sync', {
      tripId,
      latitude,
      longitude,
    });
  } catch (error) {
    logger.error('[Tracking] Failed to queue GPS ping', error, { tripId });
    throw error;
  }
}

/**
 * Perform tracking ping
 */
async function performTrackingPing(): Promise<void> {
  if (!currentTripId) {
    logger.warn('[Tracking] No active trip, skipping ping');
    return;
  }

  try {
    const position = await getCurrentLocation();
    await sendTrackingPing(currentTripId, position);
  } catch (error) {
    logger.error('[Tracking] Tracking ping failed', error, {
      tripId: currentTripId,
    });
  }
}

/**
 * Start background tracking for a trip
 */
export async function startTracking(tripId: string): Promise<void> {
  if (isTracking && currentTripId === tripId) {
    logger.info('[Tracking] Already tracking this trip', { tripId });
    return;
  }

  // Stop existing tracking if any
  if (isTracking) {
    await stopTracking();
  }

  currentTripId = tripId;
  isTracking = true;

  logger.info('[Tracking] Starting background tracking', { tripId });

  // Initial ping
  try {
    const position = await getCurrentLocation();
    await sendTrackingPing(tripId, position);
  } catch (error) {
    logger.error('[Tracking] Initial ping failed', error, { tripId });
  }

  // Setup periodic tracking
  const setupInterval = async () => {
    const batteryLevel = await getBatteryLevel();
    const isBatteryLow = batteryLevel < 0.2; // Less than 20%

    // Check if app is in background
    const isBackground =
      document.hidden || document.visibilityState === 'hidden';

    // Determine interval based on battery and background state
    let interval = TRACKING_INTERVAL_NORMAL;
    if (isBatteryLow) {
      interval = TRACKING_INTERVAL_BATTERY_LOW;
    } else if (isBackground) {
      interval = TRACKING_INTERVAL_BACKGROUND;
    }

    // Clear existing interval
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }

    // Set new interval
    trackingInterval = setInterval(() => {
      void performTrackingPing();
    }, interval);

    logger.info('[Tracking] Interval set', {
      tripId,
      interval: interval / 1000 / 60, // minutes
      batteryLevel,
      isBackground,
    });
  };

  // Setup initial interval
  await setupInterval();

  // Update interval when battery level changes
  if ('getBattery' in navigator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery = await (navigator as any).getBattery();
    battery.addEventListener('levelchange', () => {
      if (isTracking) {
        void setupInterval();
      }
    });
  }

  // Update interval when visibility changes
  document.addEventListener('visibilitychange', () => {
    if (isTracking) {
      void setupInterval();
    }
  });

  // Watch position for continuous tracking (optional, for better accuracy)
  if (navigator.geolocation && 'watchPosition' in navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (_position) => {
        // Store last known position for periodic ping
        // The actual ping is sent via interval to avoid too many requests
      },
      (error) => {
        logger.error('[Tracking] Watch position error', error, { tripId });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 seconds
      }
    );
  }
}

/**
 * Stop background tracking
 */
export async function stopTracking(): Promise<void> {
  if (!isTracking) {
    return;
  }

  logger.info('[Tracking] Stopping background tracking', {
    tripId: currentTripId,
  });

  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  isTracking = false;
  currentTripId = null;
}

/**
 * Check if tracking is active
 */
export function isTrackingActive(): boolean {
  return isTracking;
}

/**
 * Get current tracking trip ID
 */
export function getCurrentTrackingTripId(): string | null {
  return currentTripId;
}

/**
 * Register background sync for tracking (Service Worker)
 */
export function registerBackgroundTrackingSync(): void {
  if (
    'serviceWorker' in navigator &&
    'sync' in ServiceWorkerRegistration.prototype
  ) {
    navigator.serviceWorker.ready.then((registration) => {
      // Background Sync API
      const syncManager = (
        registration as unknown as {
          sync?: { register: (tag: string) => Promise<void> };
        }
      ).sync;
      if (syncManager) {
        syncManager.register('tracking-ping').catch((error: unknown) => {
          logger.warn('[Tracking] Background sync registration failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    });
  }
}
