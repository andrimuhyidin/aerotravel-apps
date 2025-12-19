/**
 * API: Training Sessions (Guide View)
 * GET /api/guide/training/sessions - Get training sessions for guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Get sessions in guide's branch
  let query = client
    .from('training_sessions')
    .select('*')
    .eq('is_active', true)
    .order('training_date', { ascending: false });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: sessions, error: sessionsError } = await query;

  if (sessionsError) {
    logger.error('Failed to fetch training sessions', sessionsError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }

  // Get attendance for current guide
  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s: { id: string }) => s.id);
    const { data: attendance } = await client
      .from('training_attendance')
      .select('session_id, attendance_status, arrived_at')
      .eq('guide_id', user.id)
      .in('session_id', sessionIds);

    // Map attendance to sessions
    const attendanceMap = new Map(
      (attendance || []).map((a: { session_id: string; attendance_status: string }) => [
        a.session_id,
        a.attendance_status,
      ]),
    );

    const sessionsWithAttendance = sessions.map((session: { id: string }) => ({
      ...session,
      attendance_status: attendanceMap.get(session.id) || null,
    }));

    return NextResponse.json({
      sessions: sessionsWithAttendance,
    });
  }

  return NextResponse.json({
    sessions: sessions || [],
  });
});
