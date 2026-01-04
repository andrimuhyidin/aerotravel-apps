/**
 * React Hooks for Supabase Realtime Subscriptions
 * Client-side hooks untuk real-time data updates
 */

'use client';

import { useEffect, useRef, useState } from 'react';

import {
  createRealtimeChannel,
  type RealtimeChannelConfig,
  type RealtimeChannelWrapper,
} from './realtime-client';
import { logger } from '@/lib/utils/logger';

/**
 * Hook untuk subscribe ke Realtime channel
 * @param channelName - Unique channel name
 * @param config - Channel configuration
 * @param callback - Callback function for events
 * @param enabled - Whether subscription is enabled (default: true)
 */
export function useRealtimeSubscription<T = unknown>(
  channelName: string,
  config: RealtimeChannelConfig,
  callback: (payload: T) => void,
  enabled: boolean = true
): {
  isSubscribed: boolean;
  error: Error | null;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannelWrapper | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      const channel = createRealtimeChannel(channelName, config, (payload) => {
        try {
          callbackRef.current(payload as T);
        } catch (err) {
          logger.error('[Realtime] Callback error in hook', err, { channelName });
          setError(err instanceof Error ? err : new Error('Callback error'));
        }
      });

      channelRef.current = channel;

      // Check subscription status
      const checkStatus = setInterval(() => {
        if (channel.isSubscribed()) {
          setIsSubscribed(true);
          setError(null);
        }
      }, 1000);

      // Cleanup
      return () => {
        clearInterval(checkStatus);
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
        setIsSubscribed(false);
      };
    } catch (err) {
      logger.error('[Realtime] Failed to create channel', err, { channelName });
      setError(err instanceof Error ? err : new Error('Failed to create channel'));
      setIsSubscribed(false);
    }
  }, [channelName, config.table, config.event, config.filter, enabled]);

  return { isSubscribed, error };
}

/**
 * Hook untuk subscribe ke multiple Realtime channels
 */
export function useRealtimeSubscriptions<T = unknown>(
  subscriptions: Array<{
    name: string;
    config: RealtimeChannelConfig;
    callback: (payload: T) => void;
  }>,
  enabled: boolean = true
): {
  subscriptions: Array<{ name: string; isSubscribed: boolean; error: Error | null }>;
} {
  const [subscriptionStates, setSubscriptionStates] = useState<
    Array<{ name: string; isSubscribed: boolean; error: Error | null }>
  >(
    subscriptions.map((sub) => ({
      name: sub.name,
      isSubscribed: false,
      error: null,
    }))
  );

  const channelsRef = useRef<Array<RealtimeChannelWrapper>>([]);
  const callbacksRef = useRef(subscriptions.map((sub) => sub.callback));

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = subscriptions.map((sub) => sub.callback);
  }, [subscriptions]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      const channels = subscriptions.map((sub, index) => {
        const channel = createRealtimeChannel(sub.name, sub.config, (payload) => {
          try {
            callbacksRef.current[index]?.(payload as T);
          } catch (err) {
            logger.error('[Realtime] Callback error in multi-subscription', err, {
              channelName: sub.name,
            });
            setSubscriptionStates((prev) =>
              prev.map((state) =>
                state.name === sub.name
                  ? {
                      ...state,
                      error: err instanceof Error ? err : new Error('Callback error'),
                    }
                  : state
              )
            );
          }
        });

        return { name: sub.name, channel };
      });

      channelsRef.current = channels.map((c) => c.channel);

      // Check subscription status periodically
      const checkStatus = setInterval(() => {
        setSubscriptionStates((prev) =>
          prev.map((state) => {
            const channel = channels.find((c) => c.name === state.name);
            if (channel) {
              return {
                ...state,
                isSubscribed: channel.channel.isSubscribed(),
                error: null,
              };
            }
            return state;
          })
        );
      }, 1000);

      // Cleanup
      return () => {
        clearInterval(checkStatus);
        channelsRef.current.forEach((channel) => {
          channel.unsubscribe();
        });
        channelsRef.current = [];
      };
    } catch (err) {
      logger.error('[Realtime] Failed to create multiple channels', err);
      setSubscriptionStates((prev) =>
        prev.map((state) => ({
          ...state,
          error: err instanceof Error ? err : new Error('Failed to create channels'),
        }))
      );
    }
  }, [subscriptions, enabled]);

  return { subscriptions: subscriptionStates };
}

