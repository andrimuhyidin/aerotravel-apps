/**
 * Guide Batch Tracking API
 * POST /api/guide/tracking/batch - Batch insert tracking positions (for sync)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const positionSchema = z.object({
  tripId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().optional(),
  altitudeMeters: z.number().optional(),
  heading: z.number().optional(),
  speedKmh: z.number().optional(),
  timestamp: z.number(),
});

const batchSchema = z.object({
  positions: z.array(positionSchema).min(1).max(100),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  
  // Validate input
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid batch data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { positions } = parsed.data;
  logger.info('POST /api/guide/tracking/batch', { count: positions.length });

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify guide has access to all trips in the batch
  const tripIds = [...new Set(positions.map((p) => p.tripId))];
  
  const { data: trips, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .in('id', tripIds)
    .eq('guide_id', user.id);

  if (tripError || !trips || trips.length !== tripIds.length) {
    return NextResponse.json(
      { error: 'Access denied to one or more trips' },
      { status: 403 }
    );
  }

  // Insert all positions
  const trackingRecords = positions.map((p) => ({
    trip_id: p.tripId,
    guide_id: user.id,
    latitude: p.latitude,
    longitude: p.longitude,
    accuracy_meters: p.accuracyMeters,
    altitude_meters: p.altitudeMeters,
    heading: p.heading,
    speed_kmh: p.speedKmh,
    recorded_at: new Date(p.timestamp).toISOString(),
    created_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from('trip_tracking')
    .insert(trackingRecords);

  if (insertError) {
    logger.error('Failed to insert batch tracking', insertError);
    return NextResponse.json(
      { error: 'Failed to save tracking data' },
      { status: 500 }
    );
  }

  logger.info('Batch tracking saved', { 
    count: positions.length,
    trips: tripIds,
  });

  return NextResponse.json({
    success: true,
    count: positions.length,
  });
});

