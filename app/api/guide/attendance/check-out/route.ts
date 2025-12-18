/**
 * API: Guide Check-out
 * POST /api/guide/attendance/check-out
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const guideCheckOutSchema = z.object({
  tripId: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timestamp: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = guideCheckOutSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, latitude, longitude, timestamp } = body;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { error } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .update({
      check_out_at: timestamp || new Date().toISOString(),
      check_out_lat: latitude ?? null,
      check_out_lng: longitude ?? null,
    })
    .eq('trip_id', tripId)
    .eq('guide_id', user.id);

  if (error) {
    logger.error('Check-out update failed', error, { tripId, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to update check-out' },
      { status: 500 },
    );
  }

  logger.info('Guide check-out recorded', { tripId, guideId: user.id });

  return NextResponse.json({ success: true });
});
