/**
 * IndexedDB Helper untuk Offline-First Guide App
 * Sesuai PRD 2.4.A - Strategi Offline (Guide App Flow)
 * PRD 2.9.E - Offline-First Architecture
 * 
 * - Pre-load: Download Trip data ke IndexedDB
 * - Queueing: Simpan mutation queue lokal
 * - Auto-Sync: Sync saat online kembali
 */

const DB_NAME = 'aerotravel-offline';
const DB_VERSION = 1;

type StoreName = 'trips' | 'manifest' | 'mutations' | 'attendance';

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Trips store
      if (!db.objectStoreNames.contains('trips')) {
        const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripsStore.createIndex('date', 'date', { unique: false });
      }

      // Manifest store
      if (!db.objectStoreNames.contains('manifest')) {
        db.createObjectStore('manifest', { keyPath: 'tripId' });
      }

      // Mutations queue (untuk sync saat online)
      if (!db.objectStoreNames.contains('mutations')) {
        const mutationsStore = db.createObjectStore('mutations', {
          keyPath: 'id',
          autoIncrement: true,
        });
        mutationsStore.createIndex('timestamp', 'timestamp', {
          unique: false,
        });
        mutationsStore.createIndex('synced', 'synced', { unique: false });
      }

      // Attendance store
      if (!db.objectStoreNames.contains('attendance')) {
        const attendanceStore = db.createObjectStore('attendance', {
          keyPath: 'id',
          autoIncrement: true,
        });
        attendanceStore.createIndex('tripId', 'tripId', { unique: false });
        attendanceStore.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

/**
 * Save trip data ke IndexedDB (Pre-load)
 */
export async function saveTrip(trip: unknown): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['trips'], 'readwrite');
  const store = transaction.objectStore('trips');
  await store.put(trip);
}

/**
 * Get trip dari IndexedDB
 */
export async function getTrip(tripId: string): Promise<unknown | null> {
  const db = await initDB();
  const transaction = db.transaction(['trips'], 'readonly');
  const store = transaction.objectStore('trips');
  return new Promise((resolve, reject) => {
    const request = store.get(tripId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add mutation ke queue (untuk sync saat online)
 */
export async function queueMutation(
  type: string,
  data: unknown
): Promise<number> {
  const db = await initDB();
  const transaction = db.transaction(['mutations'], 'readwrite');
  const store = transaction.objectStore('mutations');

  const mutation = {
    type,
    data,
    timestamp: Date.now(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(mutation);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending mutations (belum di-sync)
 */
export async function getPendingMutations(): Promise<unknown[]> {
  const db = await initDB();
  const transaction = db.transaction(['mutations'], 'readonly');
  const store = transaction.objectStore('mutations');
  const index = store.index('synced');

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(false)); // false = not synced
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark mutation as synced
 */
export async function markMutationSynced(mutationId: number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['mutations'], 'readwrite');
  const store = transaction.objectStore('mutations');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(mutationId);
    getRequest.onsuccess = () => {
      const mutation = getRequest.result;
      if (mutation) {
        mutation.synced = true;
        const putRequest = store.put(mutation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Listen for online event dan trigger sync
 */
export function onOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

