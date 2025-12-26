/**
 * Tile Downloader
 * Client-side tile downloader with progress tracking
 */

import { cacheTile } from './tile-cache';
import { logger } from '@/lib/utils/logger';

export type DownloadProgress = {
  downloaded: number;
  total: number;
  percentage: number;
};

export type DownloadOptions = {
  onProgress?: (progress: DownloadProgress) => void;
  maxConcurrent?: number;
  retryCount?: number;
  delayBetweenBatches?: number; // ms
};

/**
 * Convert lat/lon to tile coordinates (Web Mercator)
 */
function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * Generate tile URL (using OpenStreetMap tile server)
 */
function getTileUrl(x: number, y: number, z: number): string {
  // Using OpenStreetMap tile server
  // Note: Consider using a tile server with CORS enabled or proxy
  const server = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
  return `https://${server}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

/**
 * Download a single tile
 */
async function downloadTile(
  x: number,
  y: number,
  z: number,
  retryCount: number = 3
): Promise<Blob | null> {
  const url = getTileUrl(x, y, z);
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      logger.warn('Tile download failed', { 
        error: error instanceof Error ? error.message : String(error),
        x, 
        y, 
        z, 
        attempt: attempt + 1,
        url 
      });
      
      // Wait before retry (exponential backoff)
      if (attempt < retryCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  return null;
}

/**
 * Calculate all tiles for a bounding box and zoom levels
 */
function calculateTiles(
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevels: number[]
): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  
  for (const zoom of zoomLevels) {
    const nw = latLonToTile(bounds.north, bounds.west, zoom);
    const se = latLonToTile(bounds.south, bounds.east, zoom);
    
    const minX = Math.min(nw.x, se.x);
    const maxX = Math.max(nw.x, se.x);
    const minY = Math.min(nw.y, se.y);
    const maxY = Math.max(nw.y, se.y);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }
  
  return tiles;
}

/**
 * Download map region tiles
 */
export async function downloadMapRegion(
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevels: number[],
  regionName: string,
  onProgress?: (progress: DownloadProgress) => void,
  options: DownloadOptions = {}
): Promise<void> {
  const {
    maxConcurrent = 5,
    retryCount = 2,
    delayBetweenBatches = 100,
  } = options;

  // Calculate all tiles to download
  const tiles = calculateTiles(bounds, zoomLevels);
  const totalTiles = tiles.length;
  let downloaded = 0;

  logger.info('Starting map region download', {
    regionName,
    totalTiles,
    zoomLevels,
    bounds,
  });

  // Download tiles in batches
  for (let i = 0; i < tiles.length; i += maxConcurrent) {
    const batch = tiles.slice(i, i + maxConcurrent);
    
    // Download batch concurrently
    const batchPromises = batch.map(async (tile) => {
      try {
        const blob = await downloadTile(tile.x, tile.y, tile.z, retryCount);
        if (blob) {
          const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
          await cacheTile(tileKey, blob, regionName);
          downloaded++;
          
          // Report progress
          if (onProgress) {
            onProgress({
              downloaded,
              total: totalTiles,
              percentage: Math.round((downloaded / totalTiles) * 100),
            });
          }
        } else {
          logger.warn('Failed to download tile after retries', { 
            x: tile.x, 
            y: tile.y, 
            z: tile.z 
          });
        }
      } catch (error) {
        logger.error('Error downloading tile', error, {
          x: tile.x,
          y: tile.y,
          z: tile.z,
        });
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches to avoid overwhelming the server
    if (i + maxConcurrent < tiles.length && delayBetweenBatches > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  logger.info('Map region download completed', {
    regionName,
    downloaded,
    totalTiles,
    successRate: `${Math.round((downloaded / totalTiles) * 100)}%`,
  });

  if (downloaded < totalTiles * 0.9) {
    throw new Error(`Hanya ${downloaded} dari ${totalTiles} tiles berhasil di-download (${Math.round((downloaded / totalTiles) * 100)}%)`);
  }
}

/**
 * Cancel ongoing download (placeholder for future implementation)
 */
export function cancelDownload(): void {
  // TODO: Implement cancellation logic
  logger.warn('Download cancellation not yet implemented');
}

