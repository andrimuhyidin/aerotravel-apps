/**
 * React Hook for Booking Real-time Updates
 * Client-side hook untuk subscribe ke booking changes
 */

'use client';

import { useEffect, useRef, useState } from 'react';

import { setupBookingRealtimeSync } from '@/lib/realtime/booking-sync';
import { logger } from '@/lib/utils/logger';

import type { Database } from '@/types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'];

/**
 * Hook untuk subscribe ke real-time booking updates
 * @param bookingId - Booking ID
 * @param enabled - Whether subscription is enabled (default: true)
 * @returns Booking data, loading state, and error
 */
export function useBookingRealtime(
  bookingId: string | null,
  enabled: boolean = true
): {
  booking: Booking | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!bookingId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      // Setup real-time subscription
      const unsubscribe = setupBookingRealtimeSync(bookingId, (updatedBooking) => {
        setBooking(updatedBooking);
        setIsLoading(false);
        setError(null);
      });

      unsubscribeRef.current = unsubscribe;

      // Initial fetch (optional - can be done separately)
      // For now, we rely on the component to fetch initial data
      setIsLoading(false);

      // Cleanup
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (err) {
      logger.error('[useBookingRealtime] Failed to setup sync', err, { bookingId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsLoading(false);
    }
  }, [bookingId, enabled]);

  return { booking, isLoading, error };
}

/**
 * Hook untuk update booking state from real-time updates
 * Useful untuk components yang already have booking state
 */
export function useBookingRealtimeUpdate(
  bookingId: string | null,
  onUpdate: (booking: Booking) => void,
  enabled: boolean = true
): {
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!bookingId || !enabled) {
      return;
    }

    try {
      const unsubscribe = setupBookingRealtimeSync(bookingId, (updatedBooking) => {
        onUpdate(updatedBooking);
        setIsSubscribed(true);
        setError(null);
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);

      // Cleanup
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[useBookingRealtimeUpdate] Failed to setup sync', err, { bookingId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsSubscribed(false);
    }
  }, [bookingId, enabled, onUpdate]);

  return { isSubscribed, error };
}

