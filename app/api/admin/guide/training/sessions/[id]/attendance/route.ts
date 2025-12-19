/**
 * API: Training Attendance (Admin)
 * GET /api/admin/guide/training/sessions/[id]/attendance - Get attendance list
 * POST /api/admin/guide/training/sessions/[id]/attendance - Mark attendance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const markAttendanceSchema = z.object({
  guide_id: z.string().uuid(),
  attendance_status: z.enum(['present', 'absent', 'late', 'excused']),
  arrived_at: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sessionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get attendance for this session
  const { data: attendance, error } = await client
    .from('training_attendance')
    .select(`
      *,
      guide:users(id, full_name, email, phone)
    `)
    .eq('session_id', sessionId);

  if (error) {
    logger.error('Failed to fetch attendance', error, { sessionId });
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }

  return NextResponse.json({
    attendance: attendance || [],
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sessionId } = await params;
  const payload = markAttendanceSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get session
  const { data: session } = await client
    .from('training_sessions')
    .select('branch_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const branchContext = await getBranchContext(user.id);

  // Check if attendance already exists
  const { data: existing } = await client
    .from('training_attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('guide_id', payload.guide_id)
    .maybeSingle();

  const attendanceData = {
    session_id: sessionId,
    guide_id: payload.guide_id,
    branch_id: branchContext.branchId || session.branch_id,
    attendance_status: payload.attendance_status,
    arrived_at: payload.arrived_at || (payload.attendance_status === 'present' ? new Date().toISOString() : null),
    notes: payload.notes || null,
    marked_by: user.id,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    // Update existing
    const { data, error } = await withBranchFilter(
      client.from('training_attendance'),
      branchContext,
    )
      .update(attendanceData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update attendance', error, { sessionId, guideId: payload.guide_id });
      return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
    }

    result = data;
  } else {
    // Create new
    const { data, error } = await withBranchFilter(
      client.from('training_attendance'),
      branchContext,
    )
      .insert({
        ...attendanceData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create attendance', error, { sessionId, guideId: payload.guide_id });
      return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 });
    }

    result = data;
  }

  logger.info('Training attendance marked', {
    attendanceId: result.id,
    sessionId,
    guideId: payload.guide_id,
    status: payload.attendance_status,
  });

  return NextResponse.json({
    success: true,
    attendance: result,
  });
});
