/**
 * API: Manual Assign Trip to Guide
 * POST /api/admin/trips/[id]/assign
 *
 * Manually assigns trip to a specific guide and sends notification
 * Body: { guide_id: string, guide_role?: 'lead' | 'assistant' | 'driver' | 'photographer', fee_amount?: number }
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { notifyGuideAssignment } from '@/lib/integrations/guide-assignment';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tripId } = await context.params;
  const body = (await request.json()) as {
    guide_id?: string;
    guide_role?: 'lead' | 'assistant' | 'driver' | 'photographer';
    fee_amount?: number;
  };

  if (!body.guide_id) {
    return NextResponse.json({ error: 'guide_id is required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get trip info for notification and deadline calculation
  const { data: trip, error: tripError } = await client
    .from('trips')
    .select('trip_code, trip_date')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    logger.error('Trip not found for manual assignment', tripError, { tripId });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if guide exists
  const { data: guide, error: guideError } = await client
    .from('users')
    .select('id, full_name, phone, role')
    .eq('id', body.guide_id)
    .single();

  if (guideError || !guide) {
    logger.error('Guide not found', guideError, { guideId: body.guide_id });
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  if (guide.role !== 'guide') {
    return NextResponse.json({ error: 'User is not a guide' }, { status: 400 });
  }

  // Calculate confirmation deadline (H-1 jam 22:00 WIB)
  const tripDate = new Date(trip.trip_date as string);
  const hMinusOne = new Date(tripDate);
  hMinusOne.setDate(hMinusOne.getDate() - 1);
  hMinusOne.setHours(22, 0, 0, 0);
  
  // Minimum deadline: hari ini jam 22:00 (jika trip_date < 2 hari dari sekarang)
  const now = new Date();
  const minimumDeadline = new Date(now);
  minimumDeadline.setHours(22, 0, 0, 0);
  if (minimumDeadline < now) {
    minimumDeadline.setDate(minimumDeadline.getDate() + 1);
  }
  
  const confirmationDeadline = hMinusOne < minimumDeadline ? minimumDeadline : hMinusOne;

  // Create assignment with pending_confirmation status
  const { data: assignmentData, error: assignError } = await client
    .from('trip_guides')
    .insert({
      trip_id: tripId,
      guide_id: body.guide_id,
      guide_role: body.guide_role ?? 'lead',
      fee_amount: body.fee_amount ?? 300000,
      assignment_status: 'pending_confirmation',
      confirmation_deadline: confirmationDeadline.toISOString(),
      assignment_method: 'manual',
      assigned_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (assignError) {
    // Check if duplicate assignment
    if (assignError.code === '23505') {
      return NextResponse.json(
        { error: 'Guide already assigned to this trip' },
        { status: 400 }
      );
    }
    logger.error('Failed to create trip_guides assignment', assignError, {
      tripId,
      guideId: body.guide_id,
    });
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }

  // Send notification to guide with deadline
  const guidePhone = guide.phone as string | null;
  if (guidePhone) {
    await notifyGuideAssignment(
      guidePhone,
      trip.trip_code as string,
      trip.trip_date as string,
      confirmationDeadline.toISOString()
    );
  }

  logger.info('Trip manually assigned successfully', {
    tripId,
    tripCode: trip.trip_code,
    guideId: body.guide_id,
    guideName: guide.full_name,
  });

  return NextResponse.json({
    success: true,
    assignment: assignmentData,
    guide: {
      id: guide.id,
      name: guide.full_name,
    },
  });
});
