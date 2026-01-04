/**
 * API: Get Position History for Breadcrumb Trail
 * GET /api/guide/tracking/history?tripId=xxx&hours=24 - Get GPS position history
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');
  const hours = parseInt(searchParams.get('hours') || '24', 10); // Default 24 hours

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Calculate time threshold
  const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // Get position history from gps_pings
  const { data: history, error } = await withBranchFilter(
    client.from('gps_pings'),
    branchContext,
  )
    .select('latitude, longitude, created_at, accuracy_meters, speed_kmh, heading')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .gte('created_at', timeThreshold)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch position history', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch position history' }, { status: 500 });
  }

  return NextResponse.json({
    positions: (history || []).map((pos: any) => ({
      latitude: pos.latitude,
      longitude: pos.longitude,
      timestamp: pos.created_at,
      accuracy: pos.accuracy_meters,
      speed: pos.speed_kmh,
      heading: pos.heading,
    })),
    count: history?.length || 0,
    timeRange: {
      start: timeThreshold,
      end: new Date().toISOString(),
      hours,
    },
  });
});

