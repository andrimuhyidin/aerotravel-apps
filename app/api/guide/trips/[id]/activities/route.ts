/**
 * API: Trip Activity Log
 * GET /api/guide/trips/[id]/activities - Get activity log for trip
 * POST /api/guide/trips/[id]/activities - Record new activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const activitySchema = z.object({
  activityType: z.string(),
  activityLabel: z.string(),
  activityDescription: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  let query = supabase
    .from('guide_trip_activity_logs')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id);
  
  if (branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }
  
  const { data, error } = await query.order('recorded_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch activity log', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }

  return NextResponse.json({
    activities: data ?? [],
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();
  const payload = activitySchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  if (!branchContext.branchId) {
    return NextResponse.json({ error: 'Branch context required for this operation' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('guide_trip_activity_logs')
    .insert({
      trip_id: tripId,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      activity_type: payload.activityType,
      activity_label: payload.activityLabel,
      activity_description: payload.activityDescription || null,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      location_name: payload.locationName || null,
      metadata: (payload.metadata || null) as any,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to record activity', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }

  logger.info('Activity recorded', {
    activityId: data.id,
    tripId,
    guideId: user.id,
    activityType: payload.activityType,
  });

  return NextResponse.json({
    success: true,
    activity: data,
  });
});
