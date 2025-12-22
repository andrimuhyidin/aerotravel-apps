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

