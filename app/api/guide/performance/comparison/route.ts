/**
 * API: Performance Comparison
 * GET /api/guide/performance/comparison - Get comparison with team average
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year') ?? '2025')
    : new Date().getFullYear();
  const month = searchParams.get('month')
    ? parseInt(searchParams.get('month') ?? '1')
    : new Date().getMonth() + 1;

  const branchContext = await getBranchContext(user.id);

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  // Get all guides in same branch
  const { data: branchGuides } = await supabase
    .from('users')
    .select('id')
    .eq('branch_id', branchContext.branchId || '')
    .eq('role', 'guide');

  const guideIds = branchGuides?.map((g) => g.id) ?? [];

  if (guideIds.length === 0) {
    return NextResponse.json({
      comparison: {
        trips: { user: 0, average: 0, percentile: 50 },
        rating: { user: 0, average: 0, percentile: 50 },
        income: { user: 0, average: 0, percentile: 50 },
      },
    });
  }

  // Get user stats
  const [userTrips, userReviews, userIncome] = await Promise.all([
    supabase
      .from('trip_guides')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString()),
    supabase
      .from('reviews')
      .select('guide_rating')
      .eq('guide_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString()),
    supabase
      .from('guide_wallet_transactions')
      .select('amount')
      .eq('guide_id', user.id)
      .eq('type', 'earning')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString()),
  ]);

  const userTripsCount = userTrips.count ?? 0;
  const userRating =
    userReviews.data && userReviews.data.length > 0
      ? userReviews.data.reduce((sum, r) => sum + (r.guide_rating ?? 0), 0) /
        userReviews.data.length
      : 0;
  const userIncomeAmount =
    userIncome.data?.reduce(
      (sum, t) => sum + (parseFloat(String(t.amount)) || 0),
      0
    ) ?? 0;

  // Get team stats (simplified - in production, use aggregation)
  const teamStats = await Promise.all(
    guideIds.map(async (guideId) => {
      const [trips, reviews, income] = await Promise.all([
        supabase
          .from('trip_guides')
          .select('*', { count: 'exact', head: true })
          .eq('guide_id', guideId)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
        supabase
          .from('reviews')
          .select('guide_rating')
          .eq('guide_id', guideId)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
        supabase
          .from('guide_wallet_transactions')
          .select('amount')
          .eq('guide_id', guideId)
          .eq('type', 'earning')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString()),
      ]);

      return {
        trips: trips.count ?? 0,
        rating:
          reviews.data && reviews.data.length > 0
            ? reviews.data.reduce((sum, r) => sum + (r.guide_rating ?? 0), 0) /
              reviews.data.length
            : 0,
        income:
          income.data?.reduce(
            (sum, t) => sum + (parseFloat(String(t.amount)) || 0),
            0
          ) ?? 0,
      };
    })
  );

  // Calculate averages and percentile
  const tripsList = teamStats.map((s) => s.trips).sort((a, b) => a - b);
  const ratingsList = teamStats.map((s) => s.rating).sort((a, b) => a - b);
  const incomeList = teamStats.map((s) => s.income).sort((a, b) => a - b);

  const avgTrips = tripsList.reduce((sum, v) => sum + v, 0) / tripsList.length;
  const avgRating =
    ratingsList.reduce((sum, v) => sum + v, 0) / ratingsList.length;
  const avgIncome =
    incomeList.reduce((sum, v) => sum + v, 0) / incomeList.length;

  const tripsPercentile =
    tripsList.filter((v) => v <= userTripsCount).length / tripsList.length;
  const ratingPercentile =
    ratingsList.filter((v) => v <= userRating).length / ratingsList.length;
  const incomePercentile =
    incomeList.filter((v) => v <= userIncomeAmount).length / incomeList.length;

  return NextResponse.json({
    comparison: {
      trips: {
        user: userTripsCount,
        average: Math.round(avgTrips * 10) / 10,
        percentile: Math.round(tripsPercentile * 100),
      },
      rating: {
        user: Math.round(userRating * 10) / 10,
        average: Math.round(avgRating * 10) / 10,
        percentile: Math.round(ratingPercentile * 100),
      },
      income: {
        user: userIncomeAmount,
        average: Math.round(avgIncome),
        percentile: Math.round(incomePercentile * 100),
      },
    },
  });
});
