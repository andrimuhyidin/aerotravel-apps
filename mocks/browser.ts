/**
 * MSW Browser Setup
 * Use this in development when backend is not ready
 * 
 * Add to app/layout.tsx or _app.tsx:
 * if (process.env.NEXT_PUBLIC_USE_MSW === 'true') {
 *   require('@/mocks/browser');
 * }
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Start worker if in browser and MSW is enabled
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MSW === 'true') {
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  });
}

