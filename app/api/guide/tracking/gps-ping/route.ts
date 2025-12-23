import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/guide/tracking/gps-ping
 * Record GPS ping during trip for live tracking
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    tripId: string;
    guideId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number | null;
    timestamp: string;
  };

  const { tripId, guideId, latitude, longitude, accuracy, speed, timestamp } =
    body;

  if (
    !tripId ||
    !guideId ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const branchContext = await getBranchContext(user.id);

  // Insert GPS ping
  const pingData = {
    trip_id: tripId,
    guide_id: guideId,
    branch_id: branchContext.branchId,
    latitude,
    longitude,
    accuracy,
    speed,
    recorded_at: timestamp,
  };

  const { error: insertError } = await supabase
    .from('gps_pings')
    .insert(pingData);

  if (insertError) {
    logger.error('Failed to insert GPS ping', insertError, { tripId, guideId });
    return NextResponse.json(
      { error: 'Failed to record GPS ping' },
      { status: 500 }
    );
  }

  // Update guide_locations (current location)
  const { error: updateError } = await supabase.from('guide_locations').upsert(
    {
      guide_id: guideId,
      branch_id: branchContext.branchId,
      latitude,
      longitude,
      accuracy,
      last_ping_at: timestamp,
      is_active: true,
    },
    {
      onConflict: 'guide_id',
    }
  );

  if (updateError) {
    logger.warn('Failed to update guide location', updateError, { guideId });
  }

  return NextResponse.json({ success: true, message: 'GPS ping recorded' });
});
