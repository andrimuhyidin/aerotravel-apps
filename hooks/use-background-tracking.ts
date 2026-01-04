/**
 * Hook: useBackgroundTracking
 * Manages background GPS tracking for active trips
 * 
 * Usage:
 * const { startTracking, stopTracking, isTracking } = useBackgroundTracking();
 * 
 * useEffect(() => {
 *   if (tripStatus === 'on_trip') {
 *     startTracking(tripId);
 *   } else {
 *     stopTracking();
 *   }
 * }, [tripStatus, tripId]);
 */

import { useEffect, useRef } from 'react';

import {
  getCurrentTrackingTripId,
  isTrackingActive,
  registerBackgroundTrackingSync,
  startTracking,
  stopTracking,
} from '@/lib/guide/background-tracking';
import { logger } from '@/lib/utils/logger';

export function useBackgroundTracking() {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Register background sync on mount
    if (!isInitialized.current) {
      registerBackgroundTrackingSync();
      isInitialized.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (isTrackingActive()) {
        void stopTracking();
      }
    };
  }, []);

  const handleStartTracking = async (tripId: string) => {
    try {
      await startTracking(tripId);
      logger.info('[Tracking] Started via hook', { tripId });
    } catch (error) {
      logger.error('[Tracking] Failed to start', error, { tripId });
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
      logger.info('[Tracking] Stopped via hook');
    } catch (error) {
      logger.error('[Tracking] Failed to stop', error);
    }
  };

  return {
    startTracking: handleStartTracking,
    stopTracking: handleStopTracking,
    isTracking: isTrackingActive(),
    currentTripId: getCurrentTrackingTripId(),
  };
}

