/**
 * Service Worker Communication for GPS Tracking
 * Handles communication between main thread and service worker for background sync
 */

import { logger } from '@/lib/utils/logger';

type TrackingPayload = {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  heading?: number;
  speedKmh?: number;
};

/**
 * Check if Service Worker and Background Sync are supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'sync' in ServiceWorkerRegistration.prototype
  );
}

/**
 * Check if Periodic Background Sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return 'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Get the active service worker registration
 */
async function getServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    logger.error('[TrackingSW] Failed to get service worker', error);
    return null;
  }
}

/**
 * Queue a position for background sync
 */
export async function queuePositionForSync(payload: TrackingPayload): Promise<boolean> {
  const registration = await getServiceWorker();
  
  if (!registration?.active) {
    logger.warn('[TrackingSW] No active service worker');
    return false;
  }

  try {
    // Send position to service worker
    registration.active.postMessage({
      type: 'QUEUE_POSITION',
      payload,
    });

    logger.info('[TrackingSW] Position queued for sync', { tripId: payload.tripId });
    return true;
  } catch (error) {
    logger.error('[TrackingSW] Failed to queue position', error);
    return false;
  }
}

/**
 * Register periodic background sync for tracking
 */
export async function registerPeriodicTracking(tripId: string): Promise<boolean> {
  const registration = await getServiceWorker();
  
  if (!registration?.active) {
    logger.warn('[TrackingSW] No active service worker');
    return false;
  }

  try {
    // Check if periodic sync is supported
    if (isPeriodicSyncSupported()) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state !== 'granted') {
        logger.warn('[TrackingSW] Periodic sync permission not granted');
        return false;
      }
    }

    // Send message to service worker
    registration.active.postMessage({
      type: 'REGISTER_PERIODIC_SYNC',
      payload: { tripId },
    });

    logger.info('[TrackingSW] Periodic tracking registered', { tripId });
    return true;
  } catch (error) {
    logger.error('[TrackingSW] Failed to register periodic tracking', error);
    return false;
  }
}

/**
 * Unregister periodic background sync
 */
export async function unregisterPeriodicTracking(): Promise<boolean> {
  const registration = await getServiceWorker();
  
  if (!registration?.active) {
    return false;
  }

  try {
    registration.active.postMessage({
      type: 'UNREGISTER_PERIODIC_SYNC',
    });

    logger.info('[TrackingSW] Periodic tracking unregistered');
    return true;
  } catch (error) {
    logger.error('[TrackingSW] Failed to unregister periodic tracking', error);
    return false;
  }
}

/**
 * Request a one-time background sync
 */
export async function requestBackgroundSync(): Promise<boolean> {
  const registration = await getServiceWorker();
  
  if (!registration) {
    return false;
  }

  try {
    // Check if sync is supported
    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } })
        .sync.register('tracking-sync');
      logger.info('[TrackingSW] Background sync requested');
      return true;
    }
  } catch (error) {
    logger.error('[TrackingSW] Failed to request background sync', error);
  }

  return false;
}

/**
 * Listen for messages from service worker
 */
export function listenForServiceWorkerMessages(
  callback: (type: string, payload: unknown) => void
): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    const { type, payload } = event.data as { type: string; payload?: unknown };
    callback(type, payload);
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Handle TRACKING_PING_REQUIRED message from service worker
 * This is called when periodic sync triggers and we need to get current position
 */
export function setupTrackingPingHandler(
  getPosition: () => Promise<{ latitude: number; longitude: number; accuracy?: number }>,
  sendPosition: (tripId: string, position: { latitude: number; longitude: number; accuracy?: number }) => Promise<void>
): () => void {
  return listenForServiceWorkerMessages(async (type, payload) => {
    if (type === 'TRACKING_PING_REQUIRED') {
      const { tripId } = payload as { tripId: string };
      
      try {
        const position = await getPosition();
        await sendPosition(tripId, position);
        logger.info('[TrackingSW] Responded to ping request', { tripId });
      } catch (error) {
        logger.error('[TrackingSW] Failed to respond to ping request', error);
      }
    }
  });
}

