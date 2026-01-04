/**
 * React Hook for Package Availability Real-time Updates
 * Client-side hook untuk subscribe ke availability changes
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import {
  setupAvailabilityRealtimeSync,
  type AvailabilityUpdate,
} from '@/lib/realtime/availability-sync';
import { logger } from '@/lib/utils/logger';

/**
 * Hook untuk subscribe ke real-time availability updates
 * @param packageId - Package ID
 * @param enabled - Whether subscription is enabled (default: true)
 * @returns Availability update callback trigger
 */
export function useAvailabilityRealtime(
  packageId: string | null,
  enabled: boolean = true
): {
  onUpdate: (callback: (update: AvailabilityUpdate) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<((update: AvailabilityUpdate) => void) | null>(null);

  useEffect(() => {
    if (!packageId || !enabled) {
      return;
    }

    try {
      const unsubscribe = setupAvailabilityRealtimeSync(packageId, (update) => {
        if (callbackRef.current) {
          callbackRef.current(update);
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
      logger.error('[useAvailabilityRealtime] Failed to setup sync', err, { packageId });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsSubscribed(false);
    }
  }, [packageId, enabled]);

  const onUpdate = useCallback((callback: (update: AvailabilityUpdate) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onUpdate, isSubscribed, error };
}

