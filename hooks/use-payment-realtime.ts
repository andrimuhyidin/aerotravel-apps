/**
 * usePaymentRealtimeSync Hook
 * Integrates Supabase Realtime with TanStack Query for payment updates
 */

'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { createRealtimeChannel } from '@/lib/realtime/realtime-client';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Hook for subscribing to payment status changes
 */
export function usePaymentRealtimeSync(paymentId: string | null) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    if (!paymentId) return;

    setStatus('connecting');

    const channel = createRealtimeChannel<{ new: any; old: any }>(
      `payment-${paymentId}`,
      {
        table: 'payments',
        event: 'UPDATE',
        filter: `id=eq.${paymentId}`,
      },
      (payload) => {
        try {
          if (payload.new) {
            // Update payment detail cache
            queryClient.setQueryData(
              queryKeys.admin.payments.detail(paymentId),
              (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, ...payload.new };
              }
            );

            // Invalidate payment list to reflect changes
            queryClient.invalidateQueries({
              queryKey: queryKeys.admin.payments.all(),
            });

            setStatus('connected');
            logger.info('[Payment Realtime] Payment updated via realtime', {
              paymentId,
              newStatus: payload.new.status,
            });
          }
        } catch (error) {
          logger.error('[Payment Realtime] Error processing update', error, {
            paymentId,
          });
        }
      }
    );

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [paymentId, queryClient]);

  return { status };
}

/**
 * Hook for subscribing to all payment updates (for list pages)
 */
export function usePaymentsListRealtimeSync() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    setStatus('connecting');

    const channel = createRealtimeChannel<{ new: any; old: any }>(
      'payments-list',
      {
        table: 'payments',
        event: '*',
      },
      (payload) => {
        try {
          // Invalidate all payment queries on any change
          queryClient.invalidateQueries({
            queryKey: queryKeys.admin.payments.all(),
          });

          setStatus('connected');
          logger.debug('[Payment Realtime] Payment list updated via realtime');
        } catch (error) {
          logger.error('[Payment Realtime] Error processing list update', error);
        }
      }
    );

    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [queryClient]);

  return { status };
}

