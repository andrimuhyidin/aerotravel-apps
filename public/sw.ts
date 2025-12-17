/// <reference lib="webworker" />

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

