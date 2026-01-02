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

  // Calculate performance bonus based on guide's average rating
  let performanceBonus = 0;
  try {
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('guide_rating')
      .eq('guide_id', guideId)
      .not('guide_rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentReviews && recentReviews.length > 0) {
      const avgRating =
        recentReviews.reduce(
          (sum: number, r: { guide_rating: number | null }) =>
            sum + (r.guide_rating || 0),
          0
        ) / recentReviews.length;

      // Performance bonus tiers
      if (avgRating >= 4.8) {
        performanceBonus = 100000; // Rp 100k for excellent
      } else if (avgRating >= 4.5) {
        performanceBonus = 75000; // Rp 75k for very good
      } else if (avgRating >= 4.0) {
        performanceBonus = 50000; // Rp 50k for good
      } else if (avgRating >= 3.5) {
        performanceBonus = 25000; // Rp 25k for above average
      }
    }
  } catch {
    // Ignore error, keep bonus at 0
  }

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

  // Calculate other deductions from salary_deductions table
  let otherDeductions = 0;
  try {
    let deductionsQuery = supabase
      .from('salary_deductions')
      .select('amount, reason')
      .eq('guide_id', guideId)
      .eq('trip_id', tripId)
      .eq('is_applied', true)
      .neq('reason', 'late_check_in'); // Exclude late penalty, already counted

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      deductionsQuery = deductionsQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: deductions } = await deductionsQuery;

    if (deductions && deductions.length > 0) {
      otherDeductions = deductions.reduce(
        (sum: number, d: { amount: number | null }) => sum + (d.amount || 0),
        0
      );
    }
  } catch {
    // Ignore error, keep deductions at 0
  }

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
