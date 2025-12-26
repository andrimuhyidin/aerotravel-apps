/**
 * Event Handlers Initialization
 * Initialize event handlers saat app startup
 */

import 'server-only';

import { initializeEventHandlers } from './event-handlers';
import { logger } from '@/lib/utils/logger';

let initialized = false;

/**
 * Initialize event handlers (idempotent - hanya initialize sekali)
 * Call this function di app startup
 */
export function initEventHandlers(): void {
  if (initialized) {
    logger.debug('[Event Init] Event handlers already initialized');
    return;
  }

  if (typeof window !== 'undefined') {
    // Skip on client-side
    return;
  }

  try {
    initializeEventHandlers();
    initialized = true;
    logger.info('[Event Init] Event handlers initialized successfully');
  } catch (error) {
    logger.error('[Event Init] Failed to initialize event handlers', error);
  }
}

// Auto-initialize saat module di-import (server-side only)
if (typeof window === 'undefined') {
  initEventHandlers();
}

