/**
 * Package Availability Real-time Sync Service
 * Real-time synchronization untuk package availability changes
 */

'use client';

import { createRealtimeChannel, type RealtimeChannelWrapper } from './realtime-client';
import { logger } from '@/lib/utils/logger';

export type AvailabilityUpdate = {
  packageId: string;
  date: string;
  availableSlots: number;
  currentPax: number;
  maxCapacity: number;
  hasOpenTrip: boolean;
  isAvailable: boolean;
};

/**
 * Setup real-time sync untuk package availability
 * Subscribes to bookings table changes untuk auto-invalidate cache
 * @param packageId - Package ID
 * @param onAvailabilityChange - Callback function untuk availability updates
 * @returns Unsubscribe function
 */
export function setupAvailabilityRealtimeSync(
  packageId: string,
  onAvailabilityChange: (update: AvailabilityUpdate) => void
): () => void {
  const channel = createRealtimeChannel<{ new: any; old: any }>(
    `availability-${packageId}`,
    {
      table: 'bookings',
      event: '*', // INSERT, UPDATE, DELETE
      filter: `package_id=eq.${packageId}`,
    },
    (payload) => {
      try {
        // Extract booking data
        const booking = payload.new || payload.old;
        if (!booking) return;

        // Trigger availability update
        // Note: Actual availability calculation should be done server-side
        // This just notifies that availability may have changed
        onAvailabilityChange({
          packageId,
          date: booking.trip_date || '',
          availableSlots: 0, // Will be calculated server-side
          currentPax: 0, // Will be calculated server-side
          maxCapacity: 0, // Will be calculated server-side
          hasOpenTrip: false, // Will be calculated server-side
          isAvailable: false, // Will be calculated server-side
        });

        logger.debug('[Availability Sync] Availability changed', {
          packageId,
          event: payload.eventType,
        });
      } catch (error) {
        logger.error('[Availability Sync] Error processing update', error, { packageId });
      }
    }
  );

  return () => {
    channel.unsubscribe();
    logger.debug('[Availability Sync] Unsubscribed', { packageId });
  };
}

/**
 * Setup real-time sync untuk multiple packages
 * Useful untuk package list pages
 */
export function setupMultipleAvailabilityRealtimeSync(
  packageIds: string[],
  onAvailabilityChange: (update: AvailabilityUpdate) => void
): () => void {
  const channels: RealtimeChannelWrapper[] = [];

  packageIds.forEach((packageId) => {
    const channel = createRealtimeChannel<{ new: any; old: any }>(
      `availability-multi-${packageId}`,
      {
        table: 'bookings',
        event: '*',
        filter: `package_id=eq.${packageId}`,
      },
      (payload) => {
        try {
          const booking = payload.new || payload.old;
          if (!booking) return;

          onAvailabilityChange({
            packageId,
            date: booking.trip_date || '',
            availableSlots: 0,
            currentPax: 0,
            maxCapacity: 0,
            hasOpenTrip: false,
            isAvailable: false,
          });
        } catch (error) {
          logger.error('[Availability Sync] Error processing update', error, { packageId });
        }
      }
    );

    channels.push(channel);
  });

  return () => {
    channels.forEach((channel) => channel.unsubscribe());
    logger.debug('[Availability Sync] Unsubscribed from multiple packages', {
      count: packageIds.length,
    });
  };
}

