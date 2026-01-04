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
  PHOTOS: 'photos',
  MUTATION_QUEUE: 'mutation_queue',
  BRIEFING_TEMPLATES: 'briefing_templates',
} as const;

type MutationType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'UPLOAD_EVIDENCE'
  | 'ADD_EXPENSE'
  | 'TRACK_POSITION'
  | 'UPDATE_MANIFEST'
  | 'UPDATE_MANIFEST_DETAILS'
  | 'UPLOAD_PHOTO'
  | 'CHAT_MESSAGE';

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

      // Photos store for offline photo uploads
      if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
        const store = database.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        store.createIndex('tripId', 'tripId');
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }

      // Mutation queue for offline actions
      if (!database.objectStoreNames.contains(STORES.MUTATION_QUEUE)) {
        const store = database.createObjectStore(STORES.MUTATION_QUEUE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }

      // Briefing templates store for offline access
      if (!database.objectStoreNames.contains(STORES.BRIEFING_TEMPLATES)) {
        const store = database.createObjectStore(STORES.BRIEFING_TEMPLATES, { keyPath: 'tripId' });
        store.createIndex('cachedAt', 'cachedAt');
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
 * Handle conflict resolution for mutations
 */
async function resolveConflict(
  mutation: QueuedMutation,
  serverResponse: { conflict?: boolean; serverData?: unknown; message?: string }
): Promise<boolean> {
  // If server indicates conflict, we need to resolve it
  if (serverResponse.conflict) {
    logger.warn('[Offline] Conflict detected', {
      type: mutation.type,
      mutationId: mutation.id,
      serverMessage: serverResponse.message,
    });

    // For now, we'll use server data (server wins strategy)
    // In the future, we could implement more sophisticated conflict resolution
    // For example: last-write-wins, merge strategies, etc.
    
    if (serverResponse.serverData) {
      // Update local data with server data
      try {
        const database = await initDB();
        
        switch (mutation.type) {
          case 'CHECK_IN':
          case 'CHECK_OUT': {
            const { tripId } = mutation.payload as { tripId?: string };
            if (tripId && serverResponse.serverData) {
              await database.put(STORES.ATTENDANCE, {
                ...(serverResponse.serverData as Record<string, unknown>),
                tripId,
              });
            }
            break;
          }
          case 'UPDATE_MANIFEST':
          case 'UPDATE_MANIFEST_DETAILS': {
            const { tripId, passengerId } = mutation.payload as {
              tripId?: string;
              passengerId?: string;
            };
            if (tripId && passengerId && serverResponse.serverData) {
              const manifest = await database.getFromIndex(
                STORES.MANIFEST,
                'tripId',
                tripId
              );
              if (manifest && manifest.id === passengerId) {
                await database.put(STORES.MANIFEST, {
                  ...manifest,
                  ...(serverResponse.serverData as Record<string, unknown>),
                });
              }
            }
            break;
          }
          // For other types, conflict resolution is less critical
          // We'll just accept server data
        }
      } catch (error) {
        logger.error('[Offline] Failed to resolve conflict', error, {
          type: mutation.type,
          mutationId: mutation.id,
        });
        return false;
      }
    }

    return true; // Conflict resolved
  }

  return false; // No conflict
}

/**
 * Sync all pending mutations to server with exponential backoff and conflict resolution
 */
export async function syncMutations(): Promise<{ synced: number; failed: number; conflicts: number }> {
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
  let conflicts = 0;

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
        const result = await response.json() as { conflict?: boolean; serverData?: unknown; message?: string };
        
        // Handle conflicts
        if (result.conflict) {
          const resolved = await resolveConflict(mutation, result);
          if (resolved) {
            // Conflict resolved, remove from queue
            await database.delete(STORES.MUTATION_QUEUE, mutation.id);
            synced++;
            conflicts++;
            logger.info('[Offline] Conflict resolved and synced', {
              type: mutation.type,
              mutationId: mutation.id,
            });
          } else {
            // Conflict not resolved, mark as failed for manual review
            const updatedMutation: QueuedMutation = {
              ...mutation,
              status: 'failed',
              retryCount: mutation.retryCount + 1,
              timestamp: Date.now(),
            };
            await database.put(STORES.MUTATION_QUEUE, updatedMutation);
            failedCount++;
            logger.warn('[Offline] Conflict not resolved', {
              type: mutation.type,
              mutationId: mutation.id,
            });
          }
        } else {
          // No conflict, success
          await database.delete(STORES.MUTATION_QUEUE, mutation.id);
          synced++;
          logger.info('[Offline] Synced mutation', {
            type: mutation.type,
            retryCount: mutation.retryCount,
          });
        }
      } else {
        // Handle specific error codes
        const errorData = await response.json().catch(() => ({})) as { code?: string; message?: string };
        
        if (response.status === 409 && errorData.code === 'CONFLICT') {
          // Conflict error from server
          const resolved = await resolveConflict(mutation, {
            conflict: true,
            message: errorData.message,
          });
          
          if (resolved) {
            await database.delete(STORES.MUTATION_QUEUE, mutation.id);
            synced++;
            conflicts++;
          } else {
            const updatedMutation: QueuedMutation = {
              ...mutation,
              status: 'failed',
              retryCount: mutation.retryCount + 1,
              timestamp: Date.now(),
            };
            await database.put(STORES.MUTATION_QUEUE, updatedMutation);
            failedCount++;
          }
        } else {
          throw new Error(`Sync failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
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
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
        logger.error('[Offline] Sync failed, max retries reached', error, {
          type: mutation.type,
          retryCount: updatedMutation.retryCount,
        });
      }
    }
  }

  return { synced, failed: failedCount, conflicts };
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
  const handleOnline = async () => {
    logger.info('[Offline] Back online, syncing...');
    const result = await syncMutations();
    updateLastSyncTime();
    
    logger.info('[Offline] Sync completed', {
      synced: result.synced,
      failed: result.failed,
      conflicts: result.conflicts,
    });
    
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
  const syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const result = await syncMutations();
      if (result.synced > 0 || result.conflicts > 0) {
        updateLastSyncTime();
      }
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
  lastSync?: Date;
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

  // Get last sync time from localStorage
  let lastSync: Date | undefined;
  if (typeof window !== 'undefined') {
    try {
      const lastSyncStr = window.localStorage.getItem('guide_last_sync');
      if (lastSyncStr) {
        lastSync = new Date(parseInt(lastSyncStr, 10));
      }
    } catch {
      // Ignore storage errors
    }
  }

  return {
    pending: pending.length,
    syncing: syncing.length,
    failed: failedMutations.length,
    nextRetry,
    lastSync,
  };
}

/**
 * Update last sync time
 */
export function updateLastSyncTime(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('guide_last_sync', Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Photo upload queue types
 */
type QueuedPhoto = {
  id: string;
  file: Blob;
  metadata: {
    tripId?: string;
    type: string; // 'equipment', 'evidence', 'incident', etc.
    itemId?: string; // For equipment items
    latitude?: number;
    longitude?: number;
    timestamp?: string;
  };
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retryCount: number;
  createdAt: number;
  uploadedAt?: number;
  error?: string;
};

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large files
const MAX_RETRIES = 5;

/**
 * Queue photo for upload (offline-first)
 */
export async function queuePhotoUpload(
  file: File | Blob,
  metadata: QueuedPhoto['metadata'],
): Promise<string> {
  const database = await initDB();
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const queuedPhoto: QueuedPhoto = {
    id: photoId,
    file,
    metadata,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
  };

  await database.put(STORES.PHOTOS, queuedPhoto);

  // Queue mutation for sync
  await queueMutation('UPLOAD_PHOTO', {
    photoId,
    metadata,
  });

  // Try to upload immediately if online
  if (navigator.onLine) {
    syncPhotoUploads().catch((error) => {
      logger.warn('[Photo Queue] Failed to sync photos immediately', { error });
    });
  }

  return photoId;
}

/**
 * Sync queued photos to server
 */
export async function syncPhotoUploads(): Promise<{
  uploaded: number;
  failed: number;
  errors: Array<{ photoId: string; error: string }>;
}> {
  if (!navigator.onLine) {
    return { uploaded: 0, failed: 0, errors: [] };
  }

  const database = await initDB();
  const pendingPhotos = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'pending');
  const failedPhotos = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'failed');

  const photosToSync = [...pendingPhotos, ...failedPhotos] as QueuedPhoto[];
  const results = {
    uploaded: 0,
    failed: 0,
    errors: [] as Array<{ photoId: string; error: string }>,
  };

  for (const photo of photosToSync) {
    // Skip if retry limit exceeded
    if (photo.retryCount >= MAX_RETRIES) {
      await database.put(STORES.PHOTOS, {
        ...photo,
        status: 'failed',
        error: 'Max retries exceeded',
      });
      results.failed++;
      results.errors.push({ photoId: photo.id, error: 'Max retries exceeded' });
      continue;
    }

    try {
      // Update status to uploading
      await database.put(STORES.PHOTOS, {
        ...photo,
        status: 'uploading',
      });

      // Upload photo (handle chunking for large files)
      const photoUrl = await uploadPhotoWithRetry(photo);

      // Update status to completed
      await database.put(STORES.PHOTOS, {
        ...photo,
        status: 'completed',
        uploadedAt: Date.now(),
        metadata: {
          ...photo.metadata,
          photoUrl,
        },
      });

      results.uploaded++;

      // Remove from mutation queue if successful
      try {
        await database.delete(STORES.MUTATION_QUEUE, photo.id);
      } catch {
        // Ignore if not in queue
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[Photo Queue] Upload failed', { photoId: photo.id, error: errorMessage });

      // Update status to failed with exponential backoff
      await database.put(STORES.PHOTOS, {
        ...photo,
        status: 'failed',
        retryCount: photo.retryCount + 1,
        error: errorMessage,
      });

      results.failed++;
      results.errors.push({ photoId: photo.id, error: errorMessage });
    }
  }

  return results;
}

/**
 * Upload photo with retry and chunking support
 */
async function uploadPhotoWithRetry(photo: QueuedPhoto): Promise<string> {
  const fileSize = photo.file.size;
  
  // For files > 1MB, use chunked upload
  if (fileSize > CHUNK_SIZE) {
    return uploadPhotoChunked(photo);
  }

  // For smaller files, upload directly
  return uploadPhotoDirect(photo);
}

/**
 * Upload photo directly (for files < 1MB)
 */
async function uploadPhotoDirect(photo: QueuedPhoto): Promise<string> {
  const formData = new FormData();
  formData.append('file', photo.file);
  formData.append('tripId', photo.metadata.tripId || '');
  formData.append('type', photo.metadata.type);
  if (photo.metadata.itemId) {
    formData.append('itemId', photo.metadata.itemId);
  }
  if (photo.metadata.latitude !== undefined && photo.metadata.longitude !== undefined) {
    formData.append('latitude', photo.metadata.latitude.toString());
    formData.append('longitude', photo.metadata.longitude.toString());
  }
  if (photo.metadata.timestamp) {
    formData.append('timestamp', photo.metadata.timestamp);
  }

  const response = await fetch('/api/guide/photos/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url || data.photoUrl;
}

/**
 * Upload photo in chunks (for files > 1MB)
 */
async function uploadPhotoChunked(photo: QueuedPhoto): Promise<string> {
  const fileSize = photo.file.size;
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Initialize chunked upload
  const initResponse = await fetch('/api/guide/photos/upload-chunked', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      totalChunks,
      fileName: `photo_${photo.id}`,
      fileSize,
      metadata: photo.metadata,
    }),
  });

  if (!initResponse.ok) {
    throw new Error('Failed to initialize chunked upload');
  }

  // Upload each chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = photo.file.slice(start, end);

    const chunkFormData = new FormData();
    chunkFormData.append('uploadId', uploadId);
    chunkFormData.append('chunkIndex', chunkIndex.toString());
    chunkFormData.append('chunk', chunk);

    const chunkResponse = await fetch('/api/guide/photos/upload-chunked', {
      method: 'PUT',
      body: chunkFormData,
    });

    if (!chunkResponse.ok) {
      throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
    }
  }

  // Finalize upload
  const finalizeResponse = await fetch('/api/guide/photos/upload-chunked', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      action: 'finalize',
    }),
  });

  if (!finalizeResponse.ok) {
    throw new Error('Failed to finalize chunked upload');
  }

  const data = await finalizeResponse.json();
  return data.url || data.photoUrl;
}

/**
 * Get queued photos status
 */
export async function getQueuedPhotosStatus(): Promise<{
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
}> {
  const database = await initDB();
  
  const pending = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'pending');
  const uploading = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'uploading');
  const completed = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'completed');
  const failed = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'failed');

  return {
    pending: pending.length,
    uploading: uploading.length,
    completed: completed.length,
    failed: failed.length,
  };
}

/**
 * Clear completed photos (cleanup)
 */
export async function clearCompletedPhotos(olderThanDays = 7): Promise<number> {
  const database = await initDB();
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  
  const completed = await database.getAllFromIndex(STORES.PHOTOS, 'status', 'completed');
  const toDelete = (completed as QueuedPhoto[]).filter(
    (photo) => (photo.uploadedAt || photo.createdAt) < cutoffTime
  );

  for (const photo of toDelete) {
    await database.delete(STORES.PHOTOS, photo.id);
  }

  return toDelete.length;
}

/**
 * Clear manifest data from IndexedDB (H+72 cleanup)
 */
export async function clearManifestData(tripId?: string): Promise<number> {
  const database = await initDB();
  
  if (tripId) {
    // Clear specific trip manifest
    const manifestStore = database.transaction(STORES.MANIFEST, 'readwrite').objectStore(STORES.MANIFEST);
    const index = manifestStore.index('tripId');
    const range = IDBKeyRange.only(tripId);
    const manifests = await index.getAll(range);
    
    for (const manifest of manifests) {
      await manifestStore.delete(manifest.id);
    }
    
    return manifests.length;
  } else {
    // Clear all manifest data (for H+72 cleanup)
    const manifestStore = database.transaction(STORES.MANIFEST, 'readwrite').objectStore(STORES.MANIFEST);
    const allManifests = await manifestStore.getAll();
    
    // Filter manifests older than 72 hours (3 days)
    const cutoffTime = Date.now() - 72 * 60 * 60 * 1000;
    const toDelete = allManifests.filter((manifest: { updatedAt?: number; createdAt?: number }) => {
      const timestamp = manifest.updatedAt || manifest.createdAt || 0;
      return timestamp < cutoffTime;
    });
    
    for (const manifest of toDelete) {
      await manifestStore.delete(manifest.id);
    }
    
    return toDelete.length;
  }
}

/**
 * Cache briefing template for offline access
 */
export async function cacheBriefingTemplate(
  tripId: string,
  template: {
    briefingPoints: unknown;
    generatedAt: string;
    generatedBy?: string;
  }
): Promise<void> {
  const database = await initDB();

  await database.put(STORES.BRIEFING_TEMPLATES, {
    tripId,
    briefingPoints: template.briefingPoints,
    generatedAt: template.generatedAt,
    generatedBy: template.generatedBy,
    cachedAt: new Date().toISOString(),
  });

  logger.info('[Offline] Cached briefing template', { tripId });
}

/**
 * Get cached briefing template
 */
export async function getCachedBriefingTemplate(tripId: string): Promise<{
  briefingPoints: unknown;
  generatedAt: string;
  generatedBy?: string;
  cachedAt: string;
} | null> {
  const database = await initDB();

  const cached = await database.get(STORES.BRIEFING_TEMPLATES, tripId);
  if (!cached) {
    return null;
  }

  return {
    briefingPoints: (cached as { briefingPoints?: unknown }).briefingPoints,
    generatedAt: (cached as { generatedAt?: string }).generatedAt || '',
    generatedBy: (cached as { generatedBy?: string }).generatedBy,
    cachedAt: (cached as { cachedAt?: string }).cachedAt || '',
  };
}
