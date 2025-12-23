/**
 * API: Guide Performance Metrics
 * GET /api/guide/insights/performance - Get performance metrics (on-time rate, rating trend, etc.)
 *
 * @deprecated This endpoint is deprecated. Use /api/guide/metrics/unified instead.
 * This endpoint will be removed in a future version.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getBranchContext,
  withBranchFilter,
} from '@/lib/branch/branch-injection';
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
  const period = searchParams.get('period') || '30'; // days

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    const days = parseInt(period, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all completed trips in period

    // Get all completed trips in period
    const { data: tripGuides } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('trip_id, check_in_at, is_late, trip:trips(trip_date)')
      .eq('guide_id', user.id)
      .gte('check_in_at', startDate.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    const tripIds =
      tripGuides?.map((tg: { trip_id: string }) => tg.trip_id) || [];

    // Calculate on-time rate
    const totalTrips = tripGuides?.length || 0;
    const onTimeTrips =
      tripGuides?.filter((tg: { is_late: boolean }) => !tg.is_late).length || 0;
    const onTimeRate = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0;

    // Get rating trend (last 5 trips)
    let ratingTrend: number[] = [];
    if (tripIds.length > 0) {
      const { data: tripBookings } = await withBranchFilter(
        client.from('trip_bookings'),
        branchContext
      )
        .select('booking_id, trip_id')
        .in('trip_id', tripIds.slice(-5)); // Last 5 trips

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map(
          (tb: { booking_id: string }) => tb.booking_id
        );

        const { data: reviews } = await client
          .from('reviews')
          .select('guide_rating, booking_id, created_at')
          .in('booking_id', bookingIds)
          .not('guide_rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (reviews) {
          ratingTrend = reviews
            .map((r: { guide_rating: number | null }) => r.guide_rating)
            .filter((r: number | null): r is number => r !== null && r > 0)
            .reverse(); // Oldest first
        }
      }
    }

    // Calculate average rating
    const averageRating =
      ratingTrend.length > 0
        ? ratingTrend.reduce((sum, r) => sum + r, 0) / ratingTrend.length
        : 0;

    // Get comparison with other guides (anonymized percentile)
    const { data: allGuides } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('guide_id, is_late')
      .gte('check_in_at', startDate.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    let percentile = 50; // Default
    if (allGuides && allGuides.length > 0) {
      const guideStats = new Map<string, { total: number; onTime: number }>();

      for (const tg of allGuides) {
        const guideId = (tg as { guide_id: string }).guide_id;
        const isLate = (tg as { is_late: boolean }).is_late;

        if (!guideStats.has(guideId)) {
          guideStats.set(guideId, { total: 0, onTime: 0 });
        }

        const stats = guideStats.get(guideId);
        if (stats) {
          stats.total++;
          if (!isLate) {
            stats.onTime++;
          }
        }
      }

      const onTimeRates = Array.from(guideStats.values()).map(
        (s) => (s.onTime / s.total) * 100
      );
      onTimeRates.sort((a, b) => a - b);

      const userOnTimeRate = onTimeRate;
      const betterCount = onTimeRates.filter(
        (rate) => rate < userOnTimeRate
      ).length;
      percentile =
        onTimeRates.length > 0 ? (betterCount / onTimeRates.length) * 100 : 50;
    }

    // Get earnings breakdown
    const { data: wallet } = await withBranchFilter(
      client.from('guide_wallets'),
      branchContext
    )
      .select('id')
      .eq('guide_id', user.id)
      .single();

    let earningsByTrip = 0;
    if (wallet && tripIds.length > 0) {
      const { data: earnings } = await client
        .from('guide_wallet_transactions')
        .select('amount, metadata')
        .eq('wallet_id', (wallet as { id: string }).id)
        .eq('transaction_type', 'earning')
        .gte('created_at', startDate.toISOString())
        .not('metadata', 'is', null);

      if (earnings) {
        earningsByTrip = earnings.length;
      }
    }

    return NextResponse.json({
      period: days,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      totalTrips,
      onTimeTrips,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingTrend,
      percentile: Math.round(percentile),
      earningsByTrip,
    });
  } catch (error) {
    logger.error('Failed to fetch performance metrics', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
});
