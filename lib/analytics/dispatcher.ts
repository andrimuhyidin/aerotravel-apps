/**
 * Analytics Dispatcher
 * Unified event dispatching to all analytics platforms
 */

'use client';

import { trackEvent as trackGA4Event } from './analytics';
import {
  claritySetTag,
  clarityUpgrade,
  clarityIdentify,
  isClarityAvailable,
} from './clarity';
import { logger } from '@/lib/utils/logger';

// ============================================
// Types
// ============================================

export type AnalyticsPlatform = 'ga4' | 'posthog' | 'clarity' | 'custom';

export type DispatchEvent = {
  name: string;
  category: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  platforms?: AnalyticsPlatform[];
  priority?: 'low' | 'normal' | 'high';
};

type QueuedEvent = DispatchEvent & {
  timestamp: number;
  retries: number;
};

// ============================================
// State
// ============================================

const eventQueue: QueuedEvent[] = [];
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
const FLUSH_INTERVAL_MS = 5000;

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let flushInterval: ReturnType<typeof setInterval> | null = null;

// ============================================
// Online/Offline Detection
// ============================================

function handleOnline(): void {
  isOnline = true;
  flushQueue();
}

function handleOffline(): void {
  isOnline = false;
}

// ============================================
// Queue Management
// ============================================

function addToQueue(event: DispatchEvent): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest low-priority event
    const lowPriorityIndex = eventQueue.findIndex((e) => e.priority === 'low');
    if (lowPriorityIndex !== -1) {
      eventQueue.splice(lowPriorityIndex, 1);
    } else {
      eventQueue.shift(); // Remove oldest
    }
  }

  eventQueue.push({
    ...event,
    timestamp: Date.now(),
    retries: 0,
  });
}

function flushQueue(): void {
  if (!isOnline || eventQueue.length === 0) return;

  const eventsToProcess = [...eventQueue];
  eventQueue.length = 0;

  for (const event of eventsToProcess) {
    try {
      dispatchToAllPlatforms(event);
    } catch (error) {
      if (event.retries < MAX_RETRIES) {
        event.retries++;
        eventQueue.push(event);
      } else {
        logger.warn('Event dropped after max retries', {
          eventName: event.name,
          retries: event.retries,
        });
      }
    }
  }
}

// ============================================
// Platform-Specific Dispatching
// ============================================

function dispatchToGA4(event: DispatchEvent): void {
  trackGA4Event(event.name as any, {
    event_category: event.category,
    event_action: event.action,
    event_label: event.label,
    value: event.value,
    ...event.properties,
  });
}

function dispatchToClarity(event: DispatchEvent): void {
  if (!isClarityAvailable()) return;

  // Set relevant tags
  claritySetTag('event_name', event.name);
  claritySetTag('event_category', event.category);

  if (event.label) {
    claritySetTag('event_label', event.label);
  }

  // Upgrade session for high-priority events
  if (event.priority === 'high') {
    clarityUpgrade(event.name);
  }
}

function dispatchToCustomEndpoint(event: DispatchEvent): void {
  // Send to custom analytics endpoint
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/events',
      JSON.stringify({
        name: event.name,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        properties: event.properties,
        timestamp: Date.now(),
      })
    );
  }
}

function dispatchToAllPlatforms(event: DispatchEvent): void {
  const platforms = event.platforms || ['ga4', 'posthog', 'clarity'];

  for (const platform of platforms) {
    try {
      switch (platform) {
        case 'ga4':
        case 'posthog':
          dispatchToGA4(event); // GA4 handler also sends to PostHog
          break;
        case 'clarity':
          dispatchToClarity(event);
          break;
        case 'custom':
          dispatchToCustomEndpoint(event);
          break;
      }
    } catch (error) {
      logger.warn(`Failed to dispatch to ${platform}`, {
        eventName: event.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ============================================
// Public API
// ============================================

/**
 * Initialize dispatcher
 * Sets up online/offline listeners and flush interval
 */
export function initDispatcher(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic flush for queued events
  if (flushInterval) {
    clearInterval(flushInterval);
  }
  flushInterval = setInterval(flushQueue, FLUSH_INTERVAL_MS);
}

/**
 * Dispatch event to analytics platforms
 */
export function dispatch(event: DispatchEvent): void {
  if (isOnline) {
    try {
      dispatchToAllPlatforms(event);
    } catch {
      addToQueue(event);
    }
  } else {
    addToQueue(event);
  }
}

/**
 * Dispatch high-priority event (always tries immediately)
 */
export function dispatchImmediate(event: Omit<DispatchEvent, 'priority'>): void {
  dispatch({ ...event, priority: 'high' });
}

/**
 * Batch dispatch multiple events
 */
export function dispatchBatch(events: DispatchEvent[]): void {
  for (const event of events) {
    dispatch(event);
  }
}

/**
 * Sync user identity across platforms
 */
export function syncUserIdentity(
  userId: string,
  userProperties?: Record<string, unknown>
): void {
  // Sync to GA4/PostHog
  trackGA4Event('identify' as any, {
    user_id: userId,
    ...userProperties,
  });

  // Sync to Clarity
  clarityIdentify(userId);

  // Set user properties as tags in Clarity
  if (userProperties) {
    for (const [key, value] of Object.entries(userProperties)) {
      if (typeof value === 'string') {
        claritySetTag(key, value);
      }
    }
  }
}

/**
 * Get pending events count
 */
export function getPendingEventsCount(): number {
  return eventQueue.length;
}

/**
 * Force flush all queued events
 */
export function forceFlush(): void {
  flushQueue();
}

/**
 * Cleanup dispatcher
 */
export function cleanupDispatcher(): void {
  if (typeof window === 'undefined') return;

  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);

  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  // Flush remaining events
  flushQueue();
}

