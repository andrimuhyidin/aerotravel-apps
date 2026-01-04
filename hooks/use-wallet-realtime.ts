/**
 * useWalletRealtimeSync Hook
 * Integrates Supabase Realtime with TanStack Query for wallet updates
 */

'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { setupWalletRealtimeSync, setupWalletTransactionsRealtimeSync } from '@/lib/realtime/wallet-sync';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Hook for subscribing to guide wallet balance changes
 */
export function useGuideWalletRealtimeSync(userId: string | null) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    setStatus('connecting');

    const unsubscribe = setupWalletRealtimeSync(userId, 'guide', (newBalance) => {
      setCurrentBalance(newBalance);
      setStatus('connected');

      // Invalidate guide wallet queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.guide.wallet.balance(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.guide.wallet.transactions(),
      });

      logger.info('[Wallet Realtime] Guide wallet updated', { userId, newBalance });
    });

    return () => {
      unsubscribe();
      setStatus('disconnected');
    };
  }, [userId, queryClient]);

  return { status, currentBalance };
}

/**
 * Hook for subscribing to partner wallet balance changes
 */
export function usePartnerWalletRealtimeSync(userId: string | null) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    setStatus('connecting');

    const unsubscribe = setupWalletRealtimeSync(userId, 'partner', (newBalance) => {
      setCurrentBalance(newBalance);
      setStatus('connected');

      // Invalidate partner wallet queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.wallet.balance(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.wallet.transactions(),
      });

      logger.info('[Wallet Realtime] Partner wallet updated', { userId, newBalance });
    });

    return () => {
      unsubscribe();
      setStatus('disconnected');
    };
  }, [userId, queryClient]);

  return { status, currentBalance };
}

/**
 * Hook for subscribing to wallet transactions for admin payroll view
 */
export function useAdminWalletRealtimeSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    setStatus('connecting');

    // Subscribe to guide wallet transactions for payroll updates
    const unsubscribe = setupWalletTransactionsRealtimeSync(
      '*', // All users
      'guide',
      (_transaction) => {
        setStatus('connected');

        // Invalidate admin finance queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.finance.payroll.all(),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.finance.withdrawRequests(),
        });

        logger.debug('[Wallet Realtime] Admin wallet view updated');
      }
    );

    return () => {
      unsubscribe();
      setStatus('disconnected');
    };
  }, [queryClient]);

  return { status };
}
