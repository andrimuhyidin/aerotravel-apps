/**
 * React Hook for Trip Real-time Updates
 * Client-side hook untuk subscribe ke trip changes
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import {
  setupTripRealtimeSync,
  setupTripAssignmentRealtimeSync,
} from '@/lib/realtime/trip-sync';
import { logger } from '@/lib/utils/logger';

import type { Database } from '@/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripGuide = Database['public']['Tables']['trip_guides']['Row'];

/**
 * Hook untuk subscribe ke real-time trip updates
 * @param tripId - Trip ID
 * @param enabled - Whether subscription is enabled (default: true)
 * @returns Trip update callback trigger
 */
export function useTripRealtime(
  tripId: string | null,
  enabled: boolean = true
): {
  onUpdate: (callback: (trip: Trip) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<((trip: Trip) => void) | null>(null);

  useEffect(() => {
    if (!tripId || !enabled) {
      return;
    }

    try {
      const unsubscribe = setupTripRealtimeSync(tripId, (trip) => {
        if (callbackRef.current) {
          callbackRef.current(trip);
        }
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
      setError(null);

      // Cleanup
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[useTripRealtime] Failed to setup sync', err, { tripId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsSubscribed(false);
    }
  }, [tripId, enabled]);

  const onUpdate = useCallback((callback: (trip: Trip) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onUpdate, isSubscribed, error };
}

/**
 * Hook untuk subscribe ke real-time trip assignment updates
 */
export function useTripAssignmentRealtime(
  tripId: string | null,
  enabled: boolean = true
): {
  onAssignmentChange: (callback: (assignment: TripGuide) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<((assignment: TripGuide) => void) | null>(null);

  useEffect(() => {
    if (!tripId || !enabled) {
      return;
    }

    try {
      const unsubscribe = setupTripAssignmentRealtimeSync(tripId, (assignment) => {
        if (callbackRef.current) {
          callbackRef.current(assignment);
        }
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
      setError(null);

      // Cleanup
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[useTripAssignmentRealtime] Failed to setup sync', err, { tripId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsSubscribed(false);
    }
  }, [tripId, enabled]);

  const onAssignmentChange = useCallback((callback: (assignment: TripGuide) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onAssignmentChange, isSubscribed, error };
}

