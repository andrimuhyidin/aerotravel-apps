/**
 * Offline Sync Utilities for Guide App
 * IndexedDB storage + mutation queue for offline-first capability
 *
 * PRD Requirement: Pre-load data, queue mutations, auto-sync when online
 */

import { logger } from '@/lib/utils/logger';
import { IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'aero-guide-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  TRIPS: 'trips',
  MANIFEST: 'manifest',
  ATTENDANCE: 'attendance',
  EVIDENCE: 'evidence',
  EXPENSES: 'expenses',
  MUTATION_QUEUE: 'mutation_queue',
} as const;

type MutationType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'UPLOAD_EVIDENCE'
  | 'ADD_EXPENSE'
  | 'TRACK_POSITION'
  | 'UPDATE_MANIFEST'
  | 'UPDATE_MANIFEST_DETAILS';

export type SyncMode = 'normal' | 'data_saver';

const SYNC_MODE_STORAGE_KEY = 'guide_sync_mode';

type QueuedMutation = {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
};

let db: IDBPDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Trips store
      if (!database.objectStoreNames.contains(STORES.TRIPS)) {
        database.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
      }

      // Manifest store
      if (!database.objectStoreNames.contains(STORES.MANIFEST)) {
        const store = database.createObjectStore(STORES.MANIFEST, { keyPath: 'id' });
        store.createIndex('tripId', 'tripId');
      }

      // Attendance store
      if (!database.objectStoreNames.contains(STORES.ATTENDANCE)) {
        const store = database.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id' });
        store.createIndex('tripId', 'tripId');
        store.createIndex('guideId', 'guideId');
      }

      // Evidence store
      if (!database.objectStoreNames.contains(STORES.EVIDENCE)) {
        const store = database.createObjectStore(STORES.EVIDENCE, { keyPath: 'id' });
        store.createIndex('tripId', 'tripId');
      }

      // Expenses store
      if (!database.objectStoreNames.contains(STORES.EXPENSES)) {
        const store = database.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        store.createIndex('tripId', 'tripId');
      }

      // Mutation queue for offline actions
      if (!database.objectStoreNames.contains(STORES.MUTATION_QUEUE)) {
        const store = database.createObjectStore(STORES.MUTATION_QUEUE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });

  return db;
}

/**
 * Get current sync mode (normal or data_saver)
 */
export function getSyncMode(): SyncMode {
  if (typeof window === 'undefined') return 'normal';
  try {
    const stored = window.localStorage.getItem(SYNC_MODE_STORAGE_KEY);
    if (stored === 'data_saver' || stored === 'normal') {
      return stored;
    }
  } catch {
    // Ignore storage errors and fallback to normal
  }
  return 'normal';
}

/**
 * Set sync mode preference
 */
export function setSyncMode(mode: SyncMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SYNC_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

function isHeavyMutation(type: MutationType): boolean {
  return type === 'UPLOAD_EVIDENCE' || type === 'ADD_EXPENSE';
}

/**
 * Pre-load trip data for offline use (called at dermaga with signal)
 */
export async function preloadTripData(tripId: string): Promise<void> {
  const database = await initDB();

  try {
    // Fetch from API
    const response = await fetch(`/api/guide/trips/${tripId}/preload`);
    if (!response.ok) throw new Error('Failed to preload');

    const data = await response.json();

    // Store trip details
    await database.put(STORES.TRIPS, data.trip);

    // Store manifest
    for (const guest of data.manifest) {
      await database.put(STORES.MANIFEST, { ...guest, tripId });
    }

    // Store existing attendance
    if (data.attendance) {
      await database.put(STORES.ATTENDANCE, { ...data.attendance, tripId });
    }

    logger.info('[Offline] Preloaded trip', { tripId });
  } catch (error) {
    logger.error('[Offline] Preload failed', error, { tripId });
    throw error;
  }
}

/**
 * Get trip data from local storage (works offline)
 */
export async function getLocalTrip(tripId: string): Promise<unknown> {
  const database = await initDB();
  return database.get(STORES.TRIPS, tripId);
}

/**
 * Get manifest from local storage
 */
export async function getLocalManifest(tripId: string): Promise<unknown[]> {
  const database = await initDB();
  return database.getAllFromIndex(STORES.MANIFEST, 'tripId', tripId);
}

/**
 * Queue a mutation for later sync
 */
export async function queueMutation(
  type: MutationType,
  payload: Record<string, unknown>
): Promise<string> {
  const database = await initDB();

  const mutation: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  await database.add(STORES.MUTATION_QUEUE, mutation);
  logger.info('[Offline] Queued mutation', { type });

  // Try to sync immediately if online
  if (navigator.onLine) {
    void syncMutations();
  }

  return mutation.id;
}

/**
 * Save attendance locally (works offline)
 */
export async function saveLocalAttendance(
  tripId: string,
  guideId: string,
  type: 'check_in' | 'check_out',
  coordinates: { latitude: number; longitude: number }
): Promise<void> {
  const database = await initDB();
  const id = `${tripId}-${guideId}`;

  const existing = (await database.get(STORES.ATTENDANCE, id)) as Record<string, unknown> | undefined;
  const now = new Date().toISOString();

  const attendance = {
    id,
    tripId,
    guideId,
    checkInTime: type === 'check_in' ? now : existing?.checkInTime,
    checkOutTime: type === 'check_out' ? now : existing?.checkOutTime,
    checkInLocation: type === 'check_in' ? coordinates : existing?.checkInLocation,
    checkOutLocation: type === 'check_out' ? coordinates : existing?.checkOutLocation,
    updatedAt: now,
  };

  await database.put(STORES.ATTENDANCE, attendance);

  // Queue for sync
  await queueMutation(type === 'check_in' ? 'CHECK_IN' : 'CHECK_OUT', attendance);
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Check if mutation should be retried
 */
function shouldRetry(mutation: QueuedMutation): boolean {
  const maxRetries = 10;
  return mutation.retryCount < maxRetries;
}

/**
 * Sync all pending mutations to server with exponential backoff
 */
export async function syncMutations(): Promise<{ synced: number; failed: number }> {
  const database = await initDB();
  
  // Get pending and failed mutations that should be retried
  const pending = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'pending');
  const failed = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'failed');
  
  const allMutations = [
    ...(pending as QueuedMutation[]),
    ...(failed as QueuedMutation[]).filter(shouldRetry),
  ];

  let synced = 0;
  let failedCount = 0;

  const mode = typeof window !== 'undefined' ? getSyncMode() : 'normal';
  const connection = typeof navigator !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).connection
    : undefined;
  const isCellular =
    connection &&
    typeof connection.effectiveType === 'string' &&
    (connection.effectiveType.includes('cell') ||
      connection.effectiveType.includes('3g') ||
      connection.effectiveType.includes('4g') ||
      connection.effectiveType.includes('5g'));

  for (const mutation of allMutations) {
    try {
      // In data saver mode on cellular, skip heavy mutations for now
      if (mode === 'data_saver' && isCellular && isHeavyMutation(mutation.type)) {
        // Leave as pending/failed; will be retried later (e.g. on Wi-Fi or manual action)
        continue;
      }

      // Check if enough time has passed since last attempt (exponential backoff)
      const now = Date.now();
      const lastAttemptTime = mutation.timestamp + getBackoffDelay(mutation.retryCount - 1);
      
      if (mutation.status === 'failed' && now < lastAttemptTime) {
        // Skip if backoff period hasn't elapsed
        continue;
      }

      // Update status to syncing
      await database.put(STORES.MUTATION_QUEUE, { ...mutation, status: 'syncing' });

      // Send to server
      const response = await fetch('/api/guide/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation),
      });

      if (response.ok) {
        // Remove from queue on success
        await database.delete(STORES.MUTATION_QUEUE, mutation.id);
        synced++;
        logger.info('[Offline] Synced mutation', { type: mutation.type, retryCount: mutation.retryCount });
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      // Mark as failed, increment retry count
      const updatedMutation: QueuedMutation = {
        ...mutation,
        status: 'failed',
        retryCount: mutation.retryCount + 1,
        timestamp: Date.now(), // Update timestamp for backoff calculation
      };
      
      await database.put(STORES.MUTATION_QUEUE, updatedMutation);
      failedCount++;
      
      if (shouldRetry(updatedMutation)) {
        logger.warn('[Offline] Sync failed, will retry', {
          type: mutation.type,
          retryCount: updatedMutation.retryCount,
          nextRetry: new Date(Date.now() + getBackoffDelay(updatedMutation.retryCount)),
        });
      } else {
        logger.error('[Offline] Sync failed, max retries reached', error, {
          type: mutation.type,
          retryCount: updatedMutation.retryCount,
        });
      }
    }
  }

  return { synced, failed: failedCount };
}

/**
 * Get pending mutation count
 */
export async function getPendingCount(): Promise<number> {
  const database = await initDB();
  const pending = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'pending');
  return pending.length;
}

/**
 * Clear all local data (for logout)
 */
export async function clearLocalData(): Promise<void> {
  const database = await initDB();

  const tx = database.transaction(
    [STORES.TRIPS, STORES.MANIFEST, STORES.ATTENDANCE, STORES.EVIDENCE, STORES.EXPENSES],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore(STORES.TRIPS).clear(),
    tx.objectStore(STORES.MANIFEST).clear(),
    tx.objectStore(STORES.ATTENDANCE).clear(),
    tx.objectStore(STORES.EVIDENCE).clear(),
    tx.objectStore(STORES.EXPENSES).clear(),
  ]);

  await tx.done;
  logger.info('[Offline] Cleared local data');
}

/**
 * Update local manifest passenger details (offline-safe)
 */
export async function updateLocalManifestPassenger(
  tripId: string,
  passengerId: string,
  details: {
    notes?: string;
    allergy?: string;
    seasick?: boolean;
    specialRequest?: string;
  },
): Promise<void> {
  const database = await initDB();

  const all = (await database.getAllFromIndex(STORES.MANIFEST, 'tripId', tripId)) as Array<
    Record<string, unknown>
  >;

  const updated: Array<Record<string, unknown>> = [];

  for (const record of all) {
    if (record.id === passengerId) {
      updated.push({
        ...record,
        ...details,
        updatedAt: new Date().toISOString(),
      });
    } else {
      updated.push(record);
    }
  }

  const tx = database.transaction(STORES.MANIFEST, 'readwrite');
  const store = tx.objectStore(STORES.MANIFEST);

  for (const record of updated) {
    await store.put(record);
  }

  await tx.done;

  await queueMutation('UPDATE_MANIFEST_DETAILS', {
    tripId,
    passengerId,
    ...details,
  });
}

/**
 * Setup online/offline event listeners with background sync
 */
export function setupSyncListeners(): () => void {
  const handleOnline = () => {
    logger.info('[Offline] Back online, syncing...');
    void syncMutations();
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as unknown as { sync?: unknown })) {
      navigator.serviceWorker.ready.then((registration) => {
        // Background Sync API - using type assertion for browser API
        const syncManager = (registration as unknown as { sync?: { register: (tag: string) => Promise<void> } }).sync;
        if (syncManager) {
          syncManager.register('sync-mutations').catch((error: unknown) => {
            logger.warn('[Offline] Background sync registration failed', {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      });
    }
  };

  window.addEventListener('online', handleOnline);

  // Periodic sync when online (every 5 minutes)
  const syncInterval = setInterval(() => {
    if (navigator.onLine) {
      void syncMutations();
    }
  }, 5 * 60 * 1000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(syncInterval);
  };
}

/**
 * Get sync status for UI display
 */
export async function getSyncStatus(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  nextRetry?: Date;
}> {
  const database = await initDB();
  
  const pending = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'pending');
  const syncing = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'syncing');
  const failed = await database.getAllFromIndex(STORES.MUTATION_QUEUE, 'status', 'failed');
  
  const failedMutations = failed as QueuedMutation[];
  const nextRetry = failedMutations.length > 0
    ? new Date(Math.min(...failedMutations.map(m => {
        const backoffDelay = getBackoffDelay(m.retryCount);
        return m.timestamp + backoffDelay;
      })))
    : undefined;

  return {
    pending: pending.length,
    syncing: syncing.length,
    failed: failedMutations.length,
    nextRetry,
  };
}
