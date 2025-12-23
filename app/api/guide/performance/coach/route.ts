/**
 * API: AI Performance Coach
 * GET /api/guide/performance/coach
 *
 * @deprecated This endpoint is deprecated. Use /api/guide/ai/insights/unified instead.
 * This endpoint is kept for backward compatibility but will be removed in the future.
 *
 * Personalized coaching, skill gap analysis, learning path
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  generateCoachingPlan,
  type PerformanceData,
} from '@/lib/ai/performance-coach';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Fetch performance data
    const { data: trips } = await client
      .from('trip_guides')
      .select('trip:trips(status)')
      .eq('guide_id', user.id);

    const completedTrips = (trips || []).filter(
      (t: { trip: { status: string } }) => t.trip?.status === 'completed'
    ).length;

    // Fetch ratings
    const { data: reviews } = await client
      .from('reviews')
      .select('guide_rating, overall_rating, comment')
      .eq('guide_id', user.id);

    const ratings = (reviews || [])
      .map((r: any) => r.guide_rating || r.overall_rating)
      .filter((r: number | null) => r !== null) as number[];
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    // Fetch earnings
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('balance')
      .eq('guide_id', user.id)
      .maybeSingle();

    const { data: transactions } = await client
      .from('guide_wallet_transactions')
      .select('amount')
      .eq('wallet_id', wallet?.id)
      .eq('transaction_type', 'credit');

    const totalEarnings = (transactions || []).reduce(
      (sum: number, t: any) => sum + Number(t.amount || 0),
      0
    );

    // Fetch skills
    const { data: skills } = await client
      .from('guide_skills')
      .select('skill:skills(name), level, certified')
      .eq('guide_id', user.id);

    // Fetch attendance
    const { data: attendance } = await client
      .from('guide_attendance')
      .select('check_in_time, trip:trips(departure_time)')
      .eq('guide_id', user.id);

    const attendanceData = {
      onTime: 0,
      late: 0,
      total: attendance?.length || 0,
    };

    (attendance || []).forEach((a: any) => {
      if (a.check_in_time && a.trip?.departure_time) {
        const checkIn = new Date(a.check_in_time);
        const departure = new Date(a.trip.departure_time);
        if (checkIn <= departure) {
          attendanceData.onTime++;
        } else {
          attendanceData.late++;
        }
      }
    });

    // Calculate trends (simplified)
    const recentRatings = ratings.slice(-10);
    const olderRatings = ratings.slice(-20, -10);
    const recentAvg =
      recentRatings.length > 0
        ? recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length
        : averageRating;
    const olderAvg =
      olderRatings.length > 0
        ? olderRatings.reduce((sum, r) => sum + r, 0) / olderRatings.length
        : averageRating;

    const ratingTrend =
      recentAvg > olderAvg + 0.2
        ? 'improving'
        : recentAvg < olderAvg - 0.2
          ? 'declining'
          : 'stable';

    // Build performance data
    const performance: PerformanceData = {
      guideId: user.id,
      completedTrips,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      totalEarnings: Math.round(totalEarnings),
      skills: (skills || []).map((s: any) => ({
        name: s.skill?.name || 'Unknown',
        level: s.level || 1,
        certified: s.certified || false,
      })),
      recentFeedback: (reviews || []).slice(0, 10).map((r: any) => ({
        rating: r.guide_rating || r.overall_rating || 0,
        comment: r.comment || '',
        category: 'general',
      })),
      attendance: attendanceData,
      trends: {
        ratingTrend,
        earningsTrend: 'stable', // Simplified
      },
    };

    // Generate coaching plan
    const coachingPlan = await generateCoachingPlan(performance);

    return NextResponse.json({
      performance,
      coachingPlan,
    });
  } catch (error) {
    logger.error('Failed to generate coaching plan', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal membuat coaching plan' },
      { status: 500 }
    );
  }
});
