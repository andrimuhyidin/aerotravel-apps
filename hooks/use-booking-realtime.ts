/**
 * React Hook for Booking Real-time Status Updates
 * Client-side hook untuk subscribe ke booking status changes
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type BookingUpdate = {
  id: string;
  status: string;
  payment_status?: string;
  updated_at: string;
};

/**
 * Hook untuk subscribe ke real-time booking status updates
 * @param bookingId - Booking ID to subscribe to
 * @param enabled - Whether subscription is enabled (default: true)
 * @returns Booking update callback and subscription status
 */
export function useBookingRealtime(
  bookingId: string | null,
  enabled: boolean = true
): {
  onStatusChange: (callback: (status: string) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const callbackRef = useRef<((status: string) => void) | null>(null);

  useEffect(() => {
    if (!bookingId || !enabled) {
      return;
    }

    const supabase = createClient();

    try {
      const channel = supabase
        .channel(`booking-${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `id=eq.${bookingId}`,
          },
          (payload) => {
            const newData = payload.new as BookingUpdate;
            
            logger.info('[useBookingRealtime] Booking updated', {
              bookingId,
              newStatus: newData.status,
            });

            // Trigger callback if status changed
            if (callbackRef.current && newData.status) {
              callbackRef.current(newData.status);
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({
              queryKey: queryKeys.bookings.detail(bookingId),
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            setError(null);
            logger.debug('[useBookingRealtime] Subscribed', { bookingId });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsSubscribed(false);
            logger.warn('[useBookingRealtime] Subscription closed/error', { bookingId, status });
          }
        });

      // Cleanup on unmount
      return () => {
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[useBookingRealtime] Failed to setup subscription', err, { bookingId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time subscription'));
      setIsSubscribed(false);
    }
  }, [bookingId, enabled, queryClient]);

  const onStatusChange = useCallback((callback: (status: string) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onStatusChange, isSubscribed, error };
}

/**
 * Hook untuk subscribe ke real-time booking status updates by code
 * @param bookingCode - Booking code to subscribe to
 * @param enabled - Whether subscription is enabled (default: true)
 */
export function useBookingRealtimeByCode(
  bookingCode: string | null,
  enabled: boolean = true
): {
  onStatusChange: (callback: (status: string) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const callbackRef = useRef<((status: string) => void) | null>(null);

  useEffect(() => {
    if (!bookingCode || !enabled) {
      return;
    }

    const supabase = createClient();

    try {
      // Note: filtering by booking_code in realtime requires a custom filter
      // We use a workaround by subscribing to all booking updates and filtering client-side
      const channel = supabase
        .channel(`booking-code-${bookingCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `booking_code=eq.${bookingCode}`,
          },
          (payload) => {
            const newData = payload.new as BookingUpdate;
            
            logger.info('[useBookingRealtimeByCode] Booking updated', {
              bookingCode,
              newStatus: newData.status,
            });

            // Trigger callback if status changed
            if (callbackRef.current && newData.status) {
              callbackRef.current(newData.status);
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({
              queryKey: queryKeys.bookings.detail(newData.id),
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            setError(null);
            logger.debug('[useBookingRealtimeByCode] Subscribed', { bookingCode });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsSubscribed(false);
            logger.warn('[useBookingRealtimeByCode] Subscription closed/error', { bookingCode, status });
          }
        });

      // Cleanup on unmount
      return () => {
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[useBookingRealtimeByCode] Failed to setup subscription', err, { bookingCode });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time subscription'));
      setIsSubscribed(false);
    }
  }, [bookingCode, enabled, queryClient]);

  const onStatusChange = useCallback((callback: (status: string) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onStatusChange, isSubscribed, error };
}
