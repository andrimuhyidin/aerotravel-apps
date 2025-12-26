/**
 * Supabase Realtime Client Wrapper
 * Reusable client-side Realtime channel management
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

import type { RealtimeChannel } from '@supabase/supabase-js';

// Connection pool untuk manage multiple channels efficiently
const channelPool = new Map<string, RealtimeChannelWrapper>();

export type RealtimeChannelConfig = {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
};

export type RealtimeChannelWrapper = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
  isSubscribed: () => boolean;
};

/**
 * Create a Realtime channel subscription
 * @param channelName - Unique channel name
 * @param config - Channel configuration
 * @param callback - Callback function for events
 * @returns Channel wrapper with unsubscribe function
 */
export function createRealtimeChannel<T = unknown>(
  channelName: string,
  config: RealtimeChannelConfig,
  callback: (payload: T) => void
): RealtimeChannelWrapper {
  // Check if channel already exists in pool
  const existingChannel = channelPool.get(channelName);
  if (existingChannel && existingChannel.isSubscribed()) {
    logger.debug('[Realtime] Reusing existing channel', { channelName });
    return existingChannel;
  }

  const supabase = createClient();
  const channel = supabase.channel(channelName);

  // Setup postgres_changes listener
  channel.on(
    'postgres_changes',
    {
      event: config.event,
      schema: config.schema || 'public',
      table: config.table,
      filter: config.filter,
    },
    (payload) => {
      try {
        callback(payload as T);
      } catch (error) {
        logger.error('[Realtime] Callback error', error, {
          channelName,
          table: config.table,
        });
      }
    }
  );

  // Subscribe to channel
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logger.debug('[Realtime] Channel subscribed', { channelName });
    } else if (status === 'CHANNEL_ERROR') {
      logger.error('[Realtime] Channel error', new Error('Channel subscription failed'), {
        channelName,
      });
    } else if (status === 'TIMED_OUT') {
      logger.warn('[Realtime] Channel timeout', { channelName });
    } else if (status === 'CLOSED') {
      logger.debug('[Realtime] Channel closed', { channelName });
    }
  });

  const wrapper: RealtimeChannelWrapper = {
    channel,
    unsubscribe: () => {
      try {
        channel.unsubscribe();
        channelPool.delete(channelName);
        logger.debug('[Realtime] Channel unsubscribed', { channelName });
      } catch (error) {
        logger.error('[Realtime] Unsubscribe error', error, { channelName });
      }
    },
    isSubscribed: () => {
      return channel.state === 'joined';
    },
  };

  // Add to pool
  channelPool.set(channelName, wrapper);

  return wrapper;
}

/**
 * Create multiple Realtime channel subscriptions
 * Useful for subscribing to multiple tables/events
 */
export function createRealtimeChannels<T = unknown>(
  channels: Array<{
    name: string;
    config: RealtimeChannelConfig;
    callback: (payload: T) => void;
  }>
): Array<RealtimeChannelWrapper> {
  return channels.map(({ name, config, callback }) =>
    createRealtimeChannel(name, config, callback)
  );
}

/**
 * Cleanup all channels
 */
export function cleanupChannels(channels: Array<RealtimeChannelWrapper>): void {
  channels.forEach((channel) => {
    channel.unsubscribe();
  });
}

