/**
 * Booking Real-time Sync Service
 * Real-time synchronization untuk booking status changes
 */

'use client';

import { createRealtimeChannel, type RealtimeChannelWrapper } from './realtime-client';
import { logger } from '@/lib/utils/logger';

import type { Database } from '@/types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * Setup real-time sync untuk booking
 * @param bookingId - Booking ID
 * @param onUpdate - Callback function untuk booking updates
 * @returns Unsubscribe function
 */
export function setupBookingRealtimeSync(
  bookingId: string,
  onUpdate: (booking: Booking) => void
): () => void {
  const channel = createRealtimeChannel<{ new: Booking; old: Booking }>(
    `booking-${bookingId}`,
    {
      table: 'bookings',
      event: 'UPDATE',
      filter: `id=eq.${bookingId}`,
    },
    (payload) => {
      try {
        if (payload.new) {
          onUpdate(payload.new as Booking);
          logger.debug('[Booking Sync] Booking updated', { bookingId });
        }
      } catch (error) {
        logger.error('[Booking Sync] Error processing update', error, { bookingId });
      }
    }
  );

  return () => {
    channel.unsubscribe();
    logger.debug('[Booking Sync] Unsubscribed', { bookingId });
  };
}

/**
 * Setup real-time sync untuk multiple bookings
 * Useful untuk booking list pages
 */
export function setupBookingsRealtimeSync(
  bookingIds: string[],
  onUpdate: (booking: Booking) => void
): () => void {
  const channels: RealtimeChannelWrapper[] = [];

  bookingIds.forEach((bookingId) => {
    const channel = createRealtimeChannel<{ new: Booking; old: Booking }>(
      `bookings-${bookingId}`,
      {
        table: 'bookings',
        event: 'UPDATE',
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        try {
          if (payload.new) {
            onUpdate(payload.new as Booking);
          }
        } catch (error) {
          logger.error('[Booking Sync] Error processing update', error, { bookingId });
        }
      }
    );

    channels.push(channel);
  });

  return () => {
    channels.forEach((channel) => channel.unsubscribe());
    logger.debug('[Booking Sync] Unsubscribed from multiple bookings', {
      count: bookingIds.length,
    });
  };
}

