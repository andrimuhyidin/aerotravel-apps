/**
 * React Hook for Wallet Real-time Updates
 * Client-side hook untuk subscribe ke wallet balance changes
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { setupWalletRealtimeSync } from '@/lib/realtime/wallet-sync';
import { logger } from '@/lib/utils/logger';

/**
 * Hook untuk subscribe ke real-time wallet balance updates
 * @param userId - User ID
 * @param walletType - 'partner' | 'guide'
 * @param enabled - Whether subscription is enabled (default: true)
 * @returns Balance update callback trigger
 */
export function useWalletRealtime(
  userId: string | null,
  walletType: 'partner' | 'guide',
  enabled: boolean = true
): {
  onBalanceChange: (callback: (balance: number) => void) => void;
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<((balance: number) => void) | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    try {
      const unsubscribe = setupWalletRealtimeSync(userId, walletType, (balance) => {
        if (callbackRef.current) {
          callbackRef.current(balance);
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
      logger.error('[useWalletRealtime] Failed to setup sync', err, { userId, walletType });
      setError(err instanceof Error ? err : new Error('Failed to setup real-time sync'));
      setIsSubscribed(false);
    }
  }, [userId, walletType, enabled]);

  const onBalanceChange = useCallback((callback: (balance: number) => void) => {
    callbackRef.current = callback;
  }, []);

  return { onBalanceChange, isSubscribed, error };
}

