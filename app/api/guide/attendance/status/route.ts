/**
 * API: Get Attendance Status
 * GET /api/guide/attendance/status?tripId=xxx&guideId=xxx
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

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');
  const guideId = searchParams.get('guideId') || user.id;

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Note: trip_guides doesn't have branch_id, filter via trips table instead
  const { data: attendance, error } = await client.from('trip_guides')
    .select('check_in_at, check_out_at, is_late')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId)
    .single();

  if (error) {
    logger.error('Failed to fetch attendance status', error, { tripId, guideId });
    return NextResponse.json(
      { error: 'Failed to fetch attendance status' },
      { status: 500 },
    );
  }

  // Get late penalty amount if late
  let lateFine: number | undefined;
  if (attendance?.is_late) {
    let deductionQuery = client.from('salary_deductions')
      .select('amount')
      .eq('trip_id', tripId)
      .eq('guide_id', guideId)
      .eq('deduction_type', 'late_penalty');

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      deductionQuery = deductionQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: deduction } = await deductionQuery.maybeSingle();

    lateFine = deduction?.amount ? Number(deduction.amount) : 25_000; // Default penalty
  }

  return NextResponse.json({
    checkedIn: Boolean(attendance?.check_in_at),
    checkedOut: Boolean(attendance?.check_out_at),
    checkInTime: attendance?.check_in_at || undefined,
    checkOutTime: attendance?.check_out_at || undefined,
    isLate: Boolean(attendance?.is_late),
    lateFine,
  });
});

