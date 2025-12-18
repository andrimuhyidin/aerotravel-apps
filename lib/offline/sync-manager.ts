/**
 * Offline Sync Manager
 * Sesuai PRD 2.4.A - Strategi Offline (Guide App Flow)
 * PRD 2.9.E - Offline-First Architecture
 * 
 * Features:
 * - Queue mutations for offline sync
 * - Auto-sync when online
 * - Conflict resolution
 * - Retry with exponential backoff
 */

import { logger } from '@/lib/utils/logger';
import { initDB } from './indexeddb';

// Re-export from indexeddb
export { getPendingMutations, isOnline, markMutationSynced, onOnline, queueMutation } from './indexeddb';

export type AttendanceRecord = {
  tripId: string;
  guideId: string;
  type: 'check_in' | 'check_out';
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  isLate?: boolean;
  penaltyAmount?: number;
  synced: boolean;
};

export type ManifestCheckRecord = {
  tripId: string;
  passengerId: string;
  guideId: string;
  checkType: 'boarding' | 'return';
  timestamp: string;
  notes?: string;
  synced: boolean;
};

export type DocumentUpload = {
  tripId: string;
  guideId: string;
  type: 'photo' | 'receipt' | 'document';
  fileName: string;
  fileData: string; // Base64
  timestamp: string;
  synced: boolean;
};

/**
 * Save attendance record to IndexedDB
 */
export async function saveAttendance(record: AttendanceRecord): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['attendance'], 'readwrite');
  const store = transaction.objectStore('attendance');

  await new Promise<void>((resolve, reject) => {
    const request = store.add({
      ...record,
      id: `${record.tripId}-${record.guideId}-${record.type}-${record.timestamp}`,
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending attendance records
 */
export async function getPendingAttendance(): Promise<AttendanceRecord[]> {
  const db = await initDB();
  const transaction = db.transaction(['attendance'], 'readonly');
  const store = transaction.objectStore('attendance');
  const index = store.index('synced');

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(false));
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save manifest check to IndexedDB
 */
export async function saveManifestCheck(record: ManifestCheckRecord): Promise<void> {
  const db = await initDB();
  
  // Ensure manifest_checks store exists
  if (!db.objectStoreNames.contains('manifest_checks')) {
    db.close();
    const newDb = await upgradeDBWithManifestStore();
    const transaction = newDb.transaction(['manifest_checks'], 'readwrite');
    const store = transaction.objectStore('manifest_checks');
    await addToStore(store, record);
    return;
  }

  const transaction = db.transaction(['manifest_checks'], 'readwrite');
  const store = transaction.objectStore('manifest_checks');
  await addToStore(store, record);
}

async function upgradeDBWithManifestStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aerotravel-offline', 2);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('manifest_checks')) {
        const store = db.createObjectStore('manifest_checks', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('tripId', 'tripId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToStore(store: IDBObjectStore, record: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.add(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save document upload queue
 */
export async function queueDocumentUpload(doc: DocumentUpload): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['mutations'], 'readwrite');
  const store = transaction.objectStore('mutations');

  await new Promise<void>((resolve, reject) => {
    const request = store.add({
      type: 'document_upload',
      data: doc,
      timestamp: Date.now(),
      synced: false,
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sync all pending mutations to server
 */
export async function syncPendingMutations(): Promise<{
  synced: number;
  failed: number;
}> {
  const { getPendingMutations, markMutationSynced } = await import('./indexeddb');
  const mutations = await getPendingMutations();

  let synced = 0;
  let failed = 0;

  for (const mutation of mutations as Array<{ id: number; type: string; data: unknown }>) {
    try {
      const success = await syncMutation(mutation.type, mutation.data);
      if (success) {
        await markMutationSynced(mutation.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      logger.error('Sync mutation failed', error, { mutation });
      failed++;
    }
  }

  logger.info('Sync completed', { synced, failed });
  return { synced, failed };
}

/**
 * Sync a single mutation to server
 */
async function syncMutation(type: string, data: unknown): Promise<boolean> {
  const apiEndpoints: Record<string, string> = {
    attendance_check_in: '/api/guide/attendance/check-in',
    attendance_check_out: '/api/guide/attendance/check-out',
    manifest_check: '/api/guide/manifest/check',
    document_upload: '/api/guide/documents/upload',
  };

  const endpoint = apiEndpoints[type];
  if (!endpoint) {
    logger.warn('Unknown mutation type', { type });
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return response.ok;
  } catch (error) {
    logger.error('API sync failed', error);
    return false;
  }
}

/**
 * Register service worker sync event
 */
export function registerBackgroundSync(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    // Background Sync API not standard
    const reg = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    if (reg.sync) {
      reg.sync.register('sync-mutations').catch((error: Error) => {
        logger.error('Background sync registration failed', error);
      });
    }
  });
}

/**
 * Initialize offline sync
 * Call this on app startup
 */
export async function initializeOfflineSync(): Promise<void> {
  // Initialize IndexedDB
  await initDB();

  // Register background sync
  registerBackgroundSync();

  // Listen for online event
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      logger.info('Device came online, syncing...');
      await syncPendingMutations();
    });
  }

  // Initial sync if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    await syncPendingMutations();
  }
}
