/**
 * Smart Offline Preloading
 * Auto preload trip data 24 hours before trip starts
 */

import { logger } from '@/lib/utils/logger';
import { preloadTripData } from './offline-sync';

type Trip = {
  id: string;
  trip_date: string;
  trip_code: string;
  name: string;
};

/**
 * Check and preload upcoming trips
 */
export async function checkAndPreloadTrips(upcomingTrips: Trip[]): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return;
  }

  const now = new Date();
  const preloadWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  for (const trip of upcomingTrips) {
    try {
      const tripDate = new Date(trip.trip_date);
      const timeUntilTrip = tripDate.getTime() - now.getTime();

      // Preload if trip is within 24 hours and not yet started
      if (timeUntilTrip > 0 && timeUntilTrip <= preloadWindow) {
        // Check if already preloaded
        const { getLocalTrip } = await import('./offline-sync');
        const existing = await getLocalTrip(trip.id);

        if (!existing) {
          logger.info('[SmartPreload] Preloading trip', {
            tripId: trip.id,
            tripCode: trip.trip_code,
            hoursUntilTrip: Math.round(timeUntilTrip / (60 * 60 * 1000)),
          });

          await preloadTripData(trip.id);
        }
      }
    } catch (error) {
      logger.error('[SmartPreload] Failed to preload trip', error, {
        tripId: trip.id,
      });
    }
  }
}

/**
 * Setup automatic preload checking
 */
export function setupAutoPreload(
  fetchUpcomingTrips: () => Promise<Trip[]>
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }

  let intervalId: number | null = null;

  const checkAndPreload = async () => {
    if (!navigator.onLine) {
      return;
    }

    try {
      const trips = await fetchUpcomingTrips();
      await checkAndPreloadTrips(trips);
    } catch (error) {
      logger.error('[SmartPreload] Auto preload check failed', error);
    }
  };

  // Initial check
  void checkAndPreload();

  // Check every 6 hours
  intervalId = window.setInterval(checkAndPreload, 6 * 60 * 60 * 1000);

  // Also check when coming back online
  const handleOnline = () => {
    void checkAndPreload();
  };
  window.addEventListener('online', handleOnline);

  return () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
    }
    window.removeEventListener('online', handleOnline);
  };
}

