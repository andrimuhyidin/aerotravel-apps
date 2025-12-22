/**
 * API: Download Map Region for Offline Use
 * POST /api/guide/maps/download - Download tiles for a specific region
 * 
 * Note: Full implementation requires:
 * - Tile server configuration
 * - Region bounding box calculation
 * - Zoom level selection
 * - Progress tracking
 * - Storage quota management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const downloadRegionSchema = z.object({
  region: z.string(), // e.g., 'lampung', 'pahawang'
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
  zoomLevels: z.array(z.number()).optional(), // Default: [10, 11, 12, 13, 14]
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = downloadRegionSchema.parse(await request.json());

  // Check storage quota
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const available = (estimate.quota || 0) - (estimate.usage || 0);
    
    // Estimate tile size (roughly 20KB per tile)
    const estimatedTiles = calculateTileCount(
      payload.bounds,
      payload.zoomLevels || [10, 11, 12, 13, 14]
    );
    const estimatedSize = estimatedTiles * 20 * 1024; // 20KB per tile

    if (estimatedSize > available) {
      return NextResponse.json(
        {
          error: 'Storage quota tidak cukup',
          available: Math.round(available / 1024 / 1024), // MB
          required: Math.round(estimatedSize / 1024 / 1024), // MB
        },
        { status: 400 }
      );
    }
  }

  // Return download instructions
  // Note: Actual tile downloading should be done client-side due to CORS and storage limitations
  logger.info('Map region download requested', {
    guideId: user.id,
    region: payload.region,
    bounds: payload.bounds,
    zoomLevels: payload.zoomLevels || [10, 11, 12, 13, 14],
  });

  return NextResponse.json({
    success: true,
    message: 'Download instructions generated. Tiles will be cached client-side.',
    region: payload.region,
    estimatedTiles: calculateTileCount(
      payload.bounds,
      payload.zoomLevels || [10, 11, 12, 13, 14]
    ),
    estimatedSizeMB: Math.round(
      (calculateTileCount(payload.bounds, payload.zoomLevels || [10, 11, 12, 13, 14]) * 20) / 1024
    ),
  });
});

/**
 * Calculate approximate tile count for a bounding box
 */
function calculateTileCount(
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevels: number[]
): number {
  let totalTiles = 0;

  for (const zoom of zoomLevels) {
    const nw = latLonToTile(bounds.north, bounds.west, zoom);
    const se = latLonToTile(bounds.south, bounds.east, zoom);
    
    const tilesX = Math.abs(se.x - nw.x) + 1;
    const tilesY = Math.abs(se.y - nw.y) + 1;
    
    totalTiles += tilesX * tilesY;
  }

  return totalTiles;
}

/**
 * Convert lat/lon to tile coordinates
 */
function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

