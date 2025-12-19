/**
 * API: Guide Itinerary Change Request
 * POST /api/guide/trips/[id]/itinerary/change-request - Submit change request
 * GET /api/guide/trips/[id]/itinerary/change-request - Get change requests for trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const changeRequestSchema = z.object({
  day_number: z.number().int().positive(),
  activity_index: z.number().int().nonnegative().nullable().optional(),
  change_type: z.enum(['modify', 'add', 'remove', 'reorder']),
  original_time: z.string().nullable().optional(),
  original_label: z.string().nullable().optional(),
  original_location: z.string().nullable().optional(),
  requested_time: z.string().nullable().optional(),
  requested_label: z.string().min(1),
  requested_location: z.string().nullable().optional(),
  reason: z.string().min(1).optional(), // Required for add type
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;

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

  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden - Not assigned to this trip' }, { status: 403 });
  }

  const payload = changeRequestSchema.parse(await request.json());

  // Create change request
  const { data: changeRequest, error } = await client
    .from('itinerary_change_requests')
    .insert({
      trip_id: tripId,
      branch_id: branchContext.branchId,
      day_number: payload.day_number,
      activity_index: payload.activity_index ?? null,
      change_type: payload.change_type,
      original_time: payload.original_time ?? null,
      original_label: payload.original_label ?? null,
      original_location: payload.original_location ?? null,
      requested_time: payload.requested_time ?? null,
      requested_label: payload.requested_label,
      requested_location: payload.requested_location ?? null,
      reason: payload.reason ?? null,
      status: 'pending',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create itinerary change request', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to submit change request' }, { status: 500 });
  }

  logger.info('Itinerary change request created', {
    requestId: changeRequest.id,
    tripId,
    guideId: user.id,
    changeType: payload.change_type,
  });

  return NextResponse.json({
    success: true,
    change_request: changeRequest,
    message: 'Request perubahan itinerary berhasil dikirim. Menunggu approval admin.',
  });
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get change requests for this trip
  const { data: changeRequests, error } = await client
    .from('itinerary_change_requests')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch change requests', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
  }

  return NextResponse.json({
    change_requests: changeRequests || [],
  });
});
