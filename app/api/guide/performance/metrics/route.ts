/**
 * API: Performance Metrics
 * GET /api/guide/performance/metrics?period=monthly&start=2025-01-01&end=2025-01-31
 *
 * @deprecated This endpoint is deprecated. Use /api/guide/metrics/unified instead.
 * This endpoint will be removed in a future version.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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
  const period = searchParams.get('period') || 'monthly';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  // Default to current month if not provided
  const now = new Date();
  const periodStart = start
    ? new Date(start)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = end
    ? new Date(end)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    // Check if metrics already calculated
    const { data: existing } = await (supabase as any)
      .from('guide_performance_metrics')
      .select('*')
      .eq('guide_id', user.id)
      .eq('period_type', period)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .eq('period_end', periodEnd.toISOString().split('T')[0])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        metrics: existing,
      });
    }

    // Calculate metrics
    const { data: trips } = await (supabase as any)
      .from('trip_guides')
      .select(
        `
        trip:trips(
          trip_date,
          status,
          total_pax
        ),
        fee_amount
      `
      )
      .eq('guide_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const { data: reviews } = await (supabase as any)
      .from('reviews')
      .select('guide_rating')
      .eq('guide_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    // Calculate metrics
    const totalTrips = trips?.length || 0;
    const completedTrips =
      trips?.filter(
        (t: { trip?: { status?: string }; fee_amount?: number | string }) =>
          t.trip &&
          typeof t.trip === 'object' &&
          'status' in t.trip &&
          t.trip.status === 'completed'
      ).length || 0;
    const cancelledTrips =
      trips?.filter(
        (t: { trip?: { status?: string }; fee_amount?: number | string }) =>
          t.trip &&
          typeof t.trip === 'object' &&
          'status' in t.trip &&
          t.trip.status === 'cancelled'
      ).length || 0;

    const ratings = (reviews || [])
      .map((r: { guide_rating?: number | null }) => r.guide_rating)
      .filter(
        (r: number | null | undefined): r is number =>
          r !== null && r !== undefined
      );
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) /
          ratings.length
        : null;

    const totalEarnings = (trips || [])
      .filter(
        (t: { trip?: { status?: string }; fee_amount?: number | string }) =>
          t.trip &&
          typeof t.trip === 'object' &&
          'status' in t.trip &&
          t.trip.status === 'completed'
      )
      .reduce(
        (sum: number, t: { fee_amount?: number | string }) =>
          sum + Number(t.fee_amount || 0),
        0
      );

    const averagePerTrip =
      completedTrips > 0 ? totalEarnings / completedTrips : 0;

    // Calculate overall score (simplified)
    const ratingScore = averageRating ? (averageRating / 5) * 40 : 0;
    const tripsScore = Math.min((completedTrips / 10) * 30, 30); // Max 10 trips = 30 points
    const earningsScore = Math.min((totalEarnings / 5000000) * 30, 30); // Max 5M = 30 points
    const overallScore = ratingScore + tripsScore + earningsScore;

    // Determine tier
    let performanceTier = 'needs_improvement';
    if (overallScore >= 80) performanceTier = 'excellent';
    else if (overallScore >= 65) performanceTier = 'good';
    else if (overallScore >= 50) performanceTier = 'average';

    // Create or update metrics
    const metricsData = {
      guide_id: user.id,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      period_type: period,
      total_trips: totalTrips,
      completed_trips: completedTrips,
      cancelled_trips: cancelledTrips,
      average_rating: averageRating ? Number(averageRating.toFixed(2)) : null,
      total_ratings: ratings.length,
      on_time_rate: 95.0, // TODO: Calculate from actual data
      customer_satisfaction_score: averageRating
        ? Number(averageRating.toFixed(2))
        : null,
      skills_improved: 0, // TODO: Calculate from skills data
      assessments_completed: 0, // TODO: Calculate from assessments
      total_earnings: Number(totalEarnings.toFixed(2)),
      average_per_trip: Number(averagePerTrip.toFixed(2)),
      overall_score: Number(overallScore.toFixed(2)),
      performance_tier: performanceTier,
    };

    const { data: metrics, error: metricsError } = await (supabase as any)
      .from('guide_performance_metrics')
      .upsert(metricsData, {
        onConflict: 'guide_id,period_start,period_end,period_type',
      })
      .select()
      .single();

    if (metricsError) {
      logger.error('Failed to calculate metrics', metricsError, {
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to calculate metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      metrics,
    });
  } catch (error) {
    logger.error('Failed to fetch performance metrics', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
});
