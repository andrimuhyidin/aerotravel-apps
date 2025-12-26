/**
 * Event Bus Infrastructure
 * Centralized event emission dan subscription system untuk cross-app communication
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type {
  AppEvent,
  AppType,
  EventHandler,
  EventType,
} from './event-types';

// In-memory event handler registry (server-side only)
const eventHandlers: Map<EventType, Set<EventHandler>> = new Map();

/**
 * Emit an event
 * Stores event in database dan triggers registered handlers
 */
export async function emitEvent(
  event: Omit<AppEvent, 'id' | 'timestamp'>,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  try {
    // Store event in database for audit trail
    const { data: storedEvent, error: storeError } = await supabase
      .from('app_events')
      .insert({
        type: event.type,
        app: event.app,
        user_id: event.userId,
        data: event.data,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (storeError) {
      logger.error('[Event Bus] Failed to store event', storeError, { event });
      // Continue even if storage fails
    }

    // Create AppEvent object
    const appEvent: AppEvent = {
      id: storedEvent?.id || `event-${Date.now()}-${Math.random()}`,
      type: event.type,
      app: event.app,
      userId: event.userId,
      data: event.data,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Trigger registered handlers
    const handlers = eventHandlers.get(event.type);
    if (handlers) {
      // Execute handlers in parallel (non-blocking)
      const handlerPromises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(appEvent);
        } catch (error) {
          logger.error('[Event Bus] Handler error', error, {
            eventType: event.type,
            handler: handler.name || 'anonymous',
          });
        }
      });

      // Don't await - let handlers run in background
      Promise.all(handlerPromises).catch((error) => {
        logger.error('[Event Bus] Handler execution error', error, {
          eventType: event.type,
        });
      });
    }

    logger.debug('[Event Bus] Event emitted', {
      eventType: event.type,
      app: event.app,
      userId: event.userId,
      eventId: appEvent.id,
    });
  } catch (error) {
    logger.error('[Event Bus] Failed to emit event', error, { event });
    throw error;
  }
}

/**
 * Subscribe to an event type
 * Register handler untuk specific event type
 */
export function subscribeToEvent(
  eventType: EventType,
  handler: EventHandler
): () => void {
  if (!eventHandlers.has(eventType)) {
    eventHandlers.set(eventType, new Set());
  }

  eventHandlers.get(eventType)?.add(handler);

  logger.debug('[Event Bus] Handler subscribed', {
    eventType,
    handlerCount: eventHandlers.get(eventType)?.size || 0,
  });

  // Return unsubscribe function
  return () => {
    eventHandlers.get(eventType)?.delete(handler);
    logger.debug('[Event Bus] Handler unsubscribed', {
      eventType,
      handlerCount: eventHandlers.get(eventType)?.size || 0,
    });
  };
}

/**
 * Subscribe to multiple event types
 */
export function subscribeToEvents(
  subscriptions: Array<{ eventType: EventType; handler: EventHandler }>
): () => void {
  const unsubscribers = subscriptions.map(({ eventType, handler }) =>
    subscribeToEvent(eventType, handler)
  );

  // Return function to unsubscribe all
  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Get event history
 * Query events from database
 */
export async function getEventHistory(
  filters?: {
    eventType?: EventType;
    app?: AppType;
    userId?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  events: AppEvent[];
  total: number;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('app_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.eventType) {
      query = query.eq('type', filters.eventType);
    }

    if (filters?.app) {
      query = query.eq('app', filters.app);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      logger.error('[Event Bus] Failed to get event history', error, { filters });
      return { events: [], total: 0 };
    }

    return {
      events: (events || []) as AppEvent[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('[Event Bus] Failed to get event history', error, { filters });
    return { events: [], total: 0 };
  }
}

/**
 * Get active subscriptions count
 * Useful untuk monitoring
 */
export function getSubscriptionCount(eventType?: EventType): number {
  if (eventType) {
    return eventHandlers.get(eventType)?.size || 0;
  }

  // Total count across all event types
  let total = 0;
  eventHandlers.forEach((handlers) => {
    total += handlers.size;
  });
  return total;
}

