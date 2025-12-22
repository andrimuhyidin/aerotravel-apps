/**
 * Tile Cache Service
 * Manages offline map tile caching using IndexedDB
 */

import { logger } from '@/lib/utils/logger';

const DB_NAME = 'map_tile_cache';
const DB_VERSION = 1;
const STORE_NAME = 'tiles';

type TileKey = string; // Format: "z/x/y" (zoom/x/y)
type CachedTile = {
  key: TileKey;
  blob: Blob;
  timestamp: number;
  region?: string;
};

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB for tile cache
 */
export async function initTileCache(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open tile cache database', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('region', 'region', { unique: false });
      }
    };
  });
}

/**
 * Get cached tile
 */
export async function getCachedTile(key: TileKey): Promise<Blob | null> {
  try {
    const database = await initTileCache();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedTile | undefined;
        if (result && result.blob) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to get cached tile', error, { key });
    return null;
  }
}

/**
 * Cache a tile
 */
export async function cacheTile(
  key: TileKey,
  blob: Blob,
  region?: string
): Promise<void> {
  try {
    const database = await initTileCache();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const tile: CachedTile = {
        key,
        blob,
        timestamp: Date.now(),
        region,
      };

      const request = store.put(tile);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to cache tile', error, { key });
    throw error;
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

/**
 * Clear tiles for a specific region
 */
export async function clearRegionTiles(region: string): Promise<void> {
  try {
    const database = await initTileCache();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('region');
      const request = index.openCursor(IDBKeyRange.only(region));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to clear region tiles', error, { region });
    throw error;
  }
}

/**
 * Clear all cached tiles
 */
export async function clearAllTiles(): Promise<void> {
  try {
    const database = await initTileCache();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to clear all tiles', error);
    throw error;
  }
}

/**
 * Get list of cached regions
 */
export async function getCachedRegions(): Promise<string[]> {
  try {
    const database = await initTileCache();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('region');
      const request = index.getAll();

      request.onsuccess = () => {
        const tiles = request.result as CachedTile[];
        const regions = new Set(tiles.map((t) => t.region).filter((r): r is string => !!r));
        resolve(Array.from(regions));
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to get cached regions', error);
    return [];
  }
}

