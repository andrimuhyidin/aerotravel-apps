/**
 * Guide Trip Confirmation API
 * POST /api/guide/trips/[id]/confirm
 * 
 * Guide dapat accept atau reject trip assignment
 * Body: { action: 'accept' | 'reject', rejection_reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const { id: tripId } = resolvedParams;
  const body = (await request.json()) as {
    action: 'accept' | 'reject';
    rejection_reason?: string;
  };

  if (!body.action || !['accept', 'reject'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid action. Must be accept or reject' }, { status: 400 });
  }

  if (body.action === 'reject' && !body.rejection_reason) {
    return NextResponse.json(
      { error: 'Alasan penolakan wajib diisi' },
      { status: 400 },
    );
  }

  const client = supabase as unknown as any;

  // Get assignment
  const { data: assignment, error: assignmentError } = await client
    .from('trip_guides')
    .select('*, trip:trips(trip_code, trip_date, status)')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    logger.error('Assignment not found', assignmentError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Check if assignment is still pending
  if (assignment.assignment_status !== 'pending_confirmation') {
    return NextResponse.json(
      { error: `Assignment sudah ${assignment.assignment_status}. Tidak bisa diubah lagi.` },
      { status: 400 },
    );
  }

  // Check if deadline has passed
  if (assignment.confirmation_deadline && new Date(assignment.confirmation_deadline) < new Date()) {
    return NextResponse.json(
      { error: 'Deadline konfirmasi sudah lewat. Assignment akan di-reassign otomatis.' },
      { status: 400 },
    );
  }

  // Update assignment based on action
  if (body.action === 'accept') {
    const { data: updated, error: updateError } = await client
      .from('trip_guides')
      .update({
        assignment_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to confirm assignment', updateError, { assignmentId: assignment.id });
      return NextResponse.json({ error: 'Failed to confirm assignment' }, { status: 500 });
    }

    logger.info('Trip assignment confirmed', {
      tripId,
      guideId: user.id,
      assignmentId: assignment.id,
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: 'Trip berhasil dikonfirmasi',
    });
  } else {
    // Reject
    const { data: updated, error: updateError } = await client
      .from('trip_guides')
      .update({
        assignment_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: body.rejection_reason,
      })
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to reject assignment', updateError, { assignmentId: assignment.id });
      return NextResponse.json({ error: 'Failed to reject assignment' }, { status: 500 });
    }

    logger.info('Trip assignment rejected', {
      tripId,
      guideId: user.id,
      assignmentId: assignment.id,
      reason: body.rejection_reason,
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: 'Trip assignment ditolak. Akan di-reassign ke guide lain.',
    });
  }
});
