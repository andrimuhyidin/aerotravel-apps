/// <reference lib="webworker" />
/* global self, console */

import { precacheAndRoute } from '@serwist/precaching';
import { registerRoute } from '@serwist/routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from '@serwist/strategies';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST?: Array<{ url: string; revision: string | null }>;
};

// Precache all assets
precacheAndRoute(self.__SW_MANIFEST || []);

// Runtime caching strategies
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response?.status === 200 ? response : null;
        },
      },
    ],
  })
);

registerRoute(
  ({ url }) => url.hostname.includes('deepseek.com'),
  new NetworkOnly()
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response?.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Map tile caching - CacheFirst strategy for offline support
// Note: This requires tiles to be downloaded first via /api/guide/maps/download
registerRoute(
  ({ url }) => {
    // Match common tile server patterns (OpenStreetMap, Mapbox, etc.)
    return (
      url.pathname.includes('/tile/') ||
      url.pathname.includes('/tiles/') ||
      url.pathname.match(/\/\d+\/\d+\/\d+\.(png|jpg|jpeg|webp)$/i) !== null
    );
  },
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response?.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Push notification event handler
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json() as {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: Record<string, unknown>;
    };

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {},
      requireInteraction: false,
      tag: 'guide-notification',
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Failed to show push notification', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data as { url?: string } | undefined;
  const urlToOpen = data?.url || '/guide';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// =================================================================
// BACKGROUND SYNC FOR GPS TRACKING
// =================================================================

const TRACKING_DB_NAME = 'tracking-queue';
const TRACKING_STORE_NAME = 'pending-positions';

// IndexedDB helper functions
async function openTrackingDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TRACKING_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TRACKING_STORE_NAME)) {
        db.createObjectStore(TRACKING_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function getPendingPositions(): Promise<TrackingPayload[]> {
  const db = await openTrackingDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRACKING_STORE_NAME, 'readonly');
    const store = transaction.objectStore(TRACKING_STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function clearPendingPositions(): Promise<void> {
  const db = await openTrackingDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRACKING_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TRACKING_STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

type TrackingPayload = {
  id?: number;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  heading?: number;
  speedKmh?: number;
  timestamp: number;
};

// Background Sync event handler
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'tracking-sync') {
    event.waitUntil(syncPendingPositions());
  }
});

async function syncPendingPositions(): Promise<void> {
  try {
    const pendingPositions = await getPendingPositions();
    
    if (pendingPositions.length === 0) {
      console.log('[SW] No pending positions to sync');
      return;
    }
    
    console.log(`[SW] Syncing ${pendingPositions.length} pending positions`);
    
    // Batch send all pending positions
    const response = await fetch('/api/guide/tracking/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: pendingPositions }),
    });
    
    if (response.ok) {
      // Clear pending positions after successful sync
      await clearPendingPositions();
      console.log('[SW] Successfully synced pending positions');
    } else {
      console.error('[SW] Failed to sync positions', response.status);
      throw new Error('Sync failed');
    }
  } catch (error) {
    console.error('[SW] Error syncing positions', error);
    throw error;
  }
}

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'gps-tracking') {
    event.waitUntil(performPeriodicTracking());
  }
});

async function performPeriodicTracking(): Promise<void> {
  try {
    // Get active trip from IndexedDB
    const db = await openTrackingDB();
    const transaction = db.transaction('active-trip', 'readonly');
    const store = transaction.objectStore('active-trip');
    const activeTripRequest = store.get('current');
    
    const activeTrip: { tripId: string } | undefined = await new Promise((resolve) => {
      activeTripRequest.onsuccess = () => resolve(activeTripRequest.result);
      activeTripRequest.onerror = () => resolve(undefined);
    });
    
    if (!activeTrip?.tripId) {
      console.log('[SW] No active trip for periodic sync');
      return;
    }
    
    // Get position (note: service worker doesn't have geolocation access)
    // This will need to be sent from the main thread
    console.log('[SW] Periodic sync triggered for trip', activeTrip.tripId);
    
    // Notify any open windows to send position
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({
        type: 'TRACKING_PING_REQUIRED',
        tripId: activeTrip.tripId,
      });
    }
  } catch (error) {
    console.error('[SW] Error in periodic tracking', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data as { type: string; payload?: unknown };
  
  if (type === 'QUEUE_POSITION') {
    event.waitUntil(queuePosition(payload as TrackingPayload));
  }
  
  if (type === 'REGISTER_PERIODIC_SYNC') {
    event.waitUntil(registerPeriodicSync(payload as { tripId: string }));
  }
  
  if (type === 'UNREGISTER_PERIODIC_SYNC') {
    event.waitUntil(unregisterPeriodicSync());
  }
});

async function queuePosition(payload: TrackingPayload): Promise<void> {
  try {
    const db = await openTrackingDB();
    const transaction = db.transaction(TRACKING_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TRACKING_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add({ ...payload, timestamp: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    
    console.log('[SW] Position queued');
    
    // Request background sync
    await self.registration.sync.register('tracking-sync');
  } catch (error) {
    console.error('[SW] Error queueing position', error);
  }
}

async function registerPeriodicSync(payload: { tripId: string }): Promise<void> {
  try {
    // Store active trip
    const db = await openTrackingDB();
    
    // Create store if not exists
    if (!db.objectStoreNames.contains('active-trip')) {
      db.close();
      const upgradeDb = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(TRACKING_DB_NAME, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const udb = (event.target as IDBOpenDBRequest).result;
          if (!udb.objectStoreNames.contains('active-trip')) {
            udb.createObjectStore('active-trip', { keyPath: 'key' });
          }
        };
      });
      
      const transaction = upgradeDb.transaction('active-trip', 'readwrite');
      const store = transaction.objectStore('active-trip');
      store.put({ key: 'current', tripId: payload.tripId });
    }
    
    // Register periodic sync (if supported)
    if ('periodicSync' in self.registration) {
      await (self.registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } })
        .periodicSync.register('gps-tracking', {
          minInterval: 5 * 60 * 1000, // 5 minutes
        });
      console.log('[SW] Periodic sync registered');
    }
  } catch (error) {
    console.error('[SW] Error registering periodic sync', error);
  }
}

async function unregisterPeriodicSync(): Promise<void> {
  try {
    // Clear active trip
    const db = await openTrackingDB();
    if (db.objectStoreNames.contains('active-trip')) {
      const transaction = db.transaction('active-trip', 'readwrite');
      const store = transaction.objectStore('active-trip');
      store.delete('current');
    }
    
    // Unregister periodic sync
    if ('periodicSync' in self.registration) {
      await (self.registration as unknown as { periodicSync: { unregister: (tag: string) => Promise<void> } })
        .periodicSync.unregister('gps-tracking');
      console.log('[SW] Periodic sync unregistered');
    }
  } catch (error) {
    console.error('[SW] Error unregistering periodic sync', error);
  }
}

// Type definitions for Sync events
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}
