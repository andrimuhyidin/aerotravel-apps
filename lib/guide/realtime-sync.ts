/**
 * Real-time Sync with Server-Sent Events (SSE)
 * Replaces polling for notifications and broadcasts
 */

import { logger } from '@/lib/utils/logger';

type EventType = 'notification' | 'broadcast' | 'trip_update' | 'sos_alert' | 'wallet_update';

type RealtimeEvent = {
  type: EventType;
  data: unknown;
  timestamp: number;
};

type EventHandler = (event: RealtimeEvent) => void;

class RealtimeSync {
  private eventSource: EventSource | null = null;
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to SSE endpoint
   */
  connect(userId: string): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      logger.info('[Realtime] Already connected');
      return;
    }

    if (typeof window === 'undefined') return;

    try {
      const url = `/api/guide/realtime?userId=${encodeURIComponent(userId)}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        logger.info('[Realtime] Connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const realtimeEvent = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent(realtimeEvent);
        } catch (error) {
          logger.error('[Realtime] Failed to parse event', error);
        }
      };

      this.eventSource.onerror = () => {
        logger.warn('[Realtime] Connection error');
        this.eventSource?.close();
        this.scheduleReconnect(userId);
      };

      // Listen to specific event types
      this.eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent({ ...data, type: 'notification' });
        } catch (error) {
          logger.error('[Realtime] Failed to parse notification', error);
        }
      });

      this.eventSource.addEventListener('broadcast', (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent({ ...data, type: 'broadcast' });
        } catch (error) {
          logger.error('[Realtime] Failed to parse broadcast', error);
        }
      });

      this.eventSource.addEventListener('trip_update', (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent({ ...data, type: 'trip_update' });
        } catch (error) {
          logger.error('[Realtime] Failed to parse trip_update', error);
        }
      });

      this.eventSource.addEventListener('sos_alert', (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent({ ...data, type: 'sos_alert' });
        } catch (error) {
          logger.error('[Realtime] Failed to parse sos_alert', error);
        }
      });

      this.eventSource.addEventListener('wallet_update', (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;
          this.handleEvent({ ...data, type: 'wallet_update' });
        } catch (error) {
          logger.error('[Realtime] Failed to parse wallet_update', error);
        }
      });
    } catch (error) {
      logger.error('[Realtime] Failed to connect', error);
      this.scheduleReconnect(userId);
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.handlers.clear();
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)?.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Handle incoming event
   */
  private handleEvent(event: RealtimeEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          logger.error('[Realtime] Handler error', error, { type: event.type });
        }
      });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(userId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('[Realtime] Reconnecting...', {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect(userId);
    }, delay);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSync();

/**
 * Hook-like function to use realtime sync (for client components)
 */
export function useRealtimeSync(userId: string) {
  if (typeof window === 'undefined') return;

  // Connect on mount
  realtimeSync.connect(userId);

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      realtimeSync.disconnect();
    });
  }

  return {
    on: (eventType: EventType, handler: EventHandler) => realtimeSync.on(eventType, handler),
    disconnect: () => realtimeSync.disconnect(),
    isConnected: () => realtimeSync.isConnected(),
  };
}

