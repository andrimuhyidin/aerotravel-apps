import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/guide/attendance/earnings-preview
 * Get estimated earnings for a trip
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('tripId');
  const guideId = searchParams.get('guideId') || user.id;

  if (!tripId) {
    return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get attendance record
  const attendanceQuery = supabase
    .from('guide_attendance')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId)
    .single();

  const { data: attendance } = await attendanceQuery;

  // Get trip details for base pay calculation
  let tripQuery = supabase
    .from('trips')
    .select(
      `
      id,
      trip_code,
      total_pax,
      package:packages(
        id,
        base_price,
        duration_days
      )
    `
    )
    .eq('id', tripId)
    .single();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip } = await tripQuery;

  // Calculate earnings (simplified logic - adjust based on actual business rules)
  const packageData = trip?.package as {
    base_price?: number;
    duration_days?: number;
  } | null;
  const basePrice = packageData?.base_price || 0;
  const durationDays = packageData?.duration_days || 1;

  // Base pay: 10% of package price per day
  const basePay = Math.round((basePrice * 0.1) / durationDays);

  // Bonuses
  const onTimeBonus = attendance && !attendance.is_late ? 50000 : 0; // Rp 50k for on-time
  const performanceBonus = 0; // TODO: Calculate based on ratings

  // Get tips (if any)
  let tipsQuery = supabase
    .from('tips')
    .select('amount')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tipsQuery = tipsQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: tips } = await tipsQuery;
  const tipBonus = tips?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;

  // Deductions
  const latePenalty = attendance?.penalty_amount || 0;
  const otherDeductions = 0; // TODO: Calculate other deductions if any

  const totalBonuses = onTimeBonus + performanceBonus + tipBonus;
  const totalDeductions = latePenalty + otherDeductions;
  const total = basePay + totalBonuses - totalDeductions;

  const result = {
    basePay,
    bonuses: {
      onTimeBonus,
      performanceBonus,
      tipBonus,
    },
    deductions: {
      latePenalty,
      otherDeductions,
    },
    total,
    status: 'estimated' as const,
  };

  logger.info('Earnings preview calculated', {
    tripId,
    guideId,
    basePay,
    total,
  });

  return NextResponse.json(result);
});
