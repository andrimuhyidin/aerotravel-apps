/**
 * Trip Real-time Sync Service
 * Real-time synchronization untuk trip assignment and status changes
 */

'use client';

import { createRealtimeChannel, type RealtimeChannelWrapper } from './realtime-client';
import { logger } from '@/lib/utils/logger';

import type { Database } from '@/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripGuide = Database['public']['Tables']['trip_guides']['Row'];

/**
 * Setup real-time sync untuk trip
 * @param tripId - Trip ID
 * @param onUpdate - Callback function untuk trip updates
 * @returns Unsubscribe function
 */
export function setupTripRealtimeSync(
  tripId: string,
  onUpdate: (trip: Trip) => void
): () => void {
  const channel = createRealtimeChannel<{ new: Trip; old: Trip }>(
    `trip-${tripId}`,
    {
      table: 'trips',
      event: 'UPDATE',
      filter: `id=eq.${tripId}`,
    },
    (payload) => {
      try {
        if (payload.new) {
          onUpdate(payload.new as Trip);
          logger.debug('[Trip Sync] Trip updated', { tripId });
        }
      } catch (error) {
        logger.error('[Trip Sync] Error processing update', error, { tripId });
      }
    }
  );

  return () => {
    channel.unsubscribe();
    logger.debug('[Trip Sync] Unsubscribed', { tripId });
  };
}

/**
 * Setup real-time sync untuk trip assignment
 * Subscribes to trip_guides table changes
 */
export function setupTripAssignmentRealtimeSync(
  tripId: string,
  onAssignmentChange: (assignment: TripGuide) => void
): () => void {
  const channel = createRealtimeChannel<{ new: TripGuide; old: TripGuide }>(
    `trip-assignment-${tripId}`,
    {
      table: 'trip_guides',
      event: '*', // INSERT, UPDATE, DELETE
      filter: `trip_id=eq.${tripId}`,
    },
    (payload) => {
      try {
        const assignment = payload.new || payload.old;
        if (assignment) {
          onAssignmentChange(assignment as TripGuide);
          logger.debug('[Trip Sync] Assignment changed', { tripId });
        }
      } catch (error) {
        logger.error('[Trip Sync] Error processing assignment', error, { tripId });
      }
    }
  );

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Setup real-time sync untuk multiple trips
 */
export function setupTripsRealtimeSync(
  tripIds: string[],
  onUpdate: (trip: Trip) => void
): () => void {
  const channels: RealtimeChannelWrapper[] = [];

  tripIds.forEach((tripId) => {
    const channel = createRealtimeChannel<{ new: Trip; old: Trip }>(
      `trips-${tripId}`,
      {
        table: 'trips',
        event: 'UPDATE',
        filter: `id=eq.${tripId}`,
      },
      (payload) => {
        try {
          if (payload.new) {
            onUpdate(payload.new as Trip);
          }
        } catch (error) {
          logger.error('[Trip Sync] Error processing update', error, { tripId });
        }
      }
    );

    channels.push(channel);
  });

  return () => {
    channels.forEach((channel) => channel.unsubscribe());
    logger.debug('[Trip Sync] Unsubscribed from multiple trips', { count: tripIds.length });
  };
}

