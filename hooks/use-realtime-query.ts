/**
 * useRealtimeQuery Hook
 * Generic hook that combines TanStack Query with Supabase Realtime
 * for automatic cache invalidation on database changes
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

import { createRealtimeChannel, type RealtimeChannelConfig } from '@/lib/realtime/realtime-client';
import { logger } from '@/lib/utils/logger';

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type UseRealtimeQueryOptions<TData> = {
  // TanStack Query options
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  queryOptions?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>;

  // Realtime options
  realtimeConfig: RealtimeChannelConfig;
  channelName: string;

  // Optional callbacks
  onRealtimeUpdate?: (payload: any) => void;
  onError?: (error: Error) => void;
};

export type UseRealtimeQueryResult<TData> = {
  // TanStack Query results
  data: TData | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => void;

  // Realtime status
  realtimeStatus: RealtimeStatus;
};

/**
 * Hook that combines TanStack Query with Supabase Realtime
 * Automatically invalidates query cache when realtime updates occur
 *
 * @example
 * ```tsx
 * const { data, isLoading, realtimeStatus } = useRealtimeQuery({
 *   queryKey: queryKeys.admin.bookings.detail(bookingId),
 *   queryFn: () => fetchBooking(bookingId),
 *   channelName: `booking-${bookingId}`,
 *   realtimeConfig: {
 *     table: 'bookings',
 *     event: 'UPDATE',
 *     filter: `id=eq.${bookingId}`,
 *   },
 * });
 * ```
 */
export function useRealtimeQuery<TData>({
  queryKey,
  queryFn,
  queryOptions,
  realtimeConfig,
  channelName,
  onRealtimeUpdate,
  onError,
}: UseRealtimeQueryOptions<TData>): UseRealtimeQueryResult<TData> {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');

  // TanStack Query
  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn,
    ...queryOptions,
  });

  // Handle realtime update
  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      try {
        // Call custom callback if provided
        if (onRealtimeUpdate) {
          onRealtimeUpdate(payload);
        }

        // Invalidate query to refetch fresh data
        queryClient.invalidateQueries({ queryKey });

        setRealtimeStatus('connected');
        logger.debug('[Realtime Query] Data updated via realtime', {
          channel: channelName,
          event: payload.eventType,
        });
      } catch (error) {
        logger.error('[Realtime Query] Error processing update', error, {
          channel: channelName,
        });
        if (onError) {
          onError(error as Error);
        }
      }
    },
    [queryClient, queryKey, channelName, onRealtimeUpdate, onError]
  );

  // Setup realtime subscription
  useEffect(() => {
    setRealtimeStatus('connecting');

    const channel = createRealtimeChannel<{ new: any; old: any }>(
      channelName,
      realtimeConfig,
      handleRealtimeUpdate
    );

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
      setRealtimeStatus('disconnected');
    };
  }, [channelName, realtimeConfig, handleRealtimeUpdate]);

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    realtimeStatus,
  };
}

/**
 * Hook for subscribing to a table without a query
 * Useful for list pages where you want to invalidate on any change
 */
export function useRealtimeSubscription(
  channelName: string,
  realtimeConfig: RealtimeChannelConfig,
  queryKeysToInvalidate: QueryKey[]
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    setStatus('connecting');

    const channel = createRealtimeChannel<{ new: any; old: any }>(
      channelName,
      realtimeConfig,
      () => {
        // Invalidate all specified query keys
        queryKeysToInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });

        setStatus('connected');
        logger.debug('[Realtime Subscription] Queries invalidated', {
          channel: channelName,
          keysCount: queryKeysToInvalidate.length,
        });
      }
    );

    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [channelName, realtimeConfig, queryKeysToInvalidate, queryClient]);

  return { status };
}

