/**
 * API: Guide Tracking Ping
 * POST /api/guide/tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const trackingSchema = z.object({
  tripId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
  altitudeMeters: z.number().optional(),
  heading: z.number().optional(),
  speedKmh: z.number().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = trackingSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, latitude, longitude, accuracyMeters, altitudeMeters, heading, speedKmh } =
    body;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const now = new Date().toISOString();

  const { error: pingError } = await withBranchFilter(
    client.from('gps_pings'),
    branchContext,
  ).insert({
    trip_id: tripId,
    guide_id: user.id,
    latitude,
    longitude,
    accuracy_meters: accuracyMeters ?? null,
    altitude_meters: altitudeMeters ?? null,
    heading: heading ?? null,
    speed_kmh: speedKmh ?? null,
  } as never);

  if (pingError) {
    logger.error('Failed to insert gps_ping', pingError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to record ping' }, { status: 500 });
  }

  const { error: locError } = await withBranchFilter(
    client.from('guide_locations'),
    branchContext,
  ).upsert(
    {
      guide_id: user.id,
      trip_id: tripId,
      latitude,
      longitude,
      accuracy_meters: accuracyMeters ?? null,
      is_online: true,
      last_seen_at: now,
    } as never,
    { onConflict: 'guide_id' },
  );

  if (locError) {
    logger.error('Failed to upsert guide_locations', locError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to update current location' }, { status: 500 });
  }

  logger.info('Guide tracking ping saved', { tripId, guideId: user.id });

  return NextResponse.json({ success: true });
});
