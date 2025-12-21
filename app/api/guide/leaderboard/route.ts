/**
 * API: Guide Leaderboard
 * GET /api/guide/leaderboard - Get monthly leaderboard (Top 5 Guide)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import { calculateLevel, type GuideLevel } from '@/lib/guide/gamification';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type LeaderboardEntry = {
  guideId: string;
  guideName: string;
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  level: GuideLevel;
  rank: number;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  
  // Get period from query params (default: monthly)
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'yearly';
  const monthParam = searchParams.get('month'); // Format: YYYY-MM
  const yearParam = searchParams.get('year'); // Format: YYYY

  // Build cache key
  const branchCacheKey = branchContext.branchId || 'all';
  const cacheKey = `${cacheKeys.guide.leaderboard(branchCacheKey)}:${period}:${monthParam || ''}:${yearParam || ''}`;

  // Use cache for expensive leaderboard query
  const result = await getCached(
    cacheKey,
    cacheTTL.leaderboard,
    async () => {
      const client = supabase as unknown as any;

      // Get date range based on period and selected date
      let startDate: Date;
      let endDate: Date;

      if (period === 'yearly') {
        const selectedYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        // Yearly: from start of selected year to end of selected year
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      } else {
        // Monthly: from start of selected month to end of selected month
        if (monthParam) {
          const parts = monthParam.split('-');
          const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
          const month = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0, 23, 59, 59);
        } else {
          // Default to current month
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
      }

      // Get all guides in this branch
      const { data: guides, error: guidesError } = await client
    .from('users')
    .select('id, full_name')
    .eq('role', 'guide')
    .eq('branch_id', branchContext.branchId);

  if (guidesError || !guides) {
    logger.error('Failed to fetch guides', guidesError, { branchId: branchContext.branchId });
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }

  // Optimize: Batch query all guide stats instead of N+1 queries
  const guideIds = guides.map((g: { id: string }) => g.id);

  // Get all trip counts in one query using GROUP BY
  const { data: tripCountsData } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('guide_id')
    .in('guide_id', guideIds)
    .gte('check_in_at', startDate.toISOString())
    .lte('check_in_at', endDate.toISOString())
    .not('check_in_at', 'is', null)
    .not('check_out_at', 'is', null);

  // Count trips per guide
  const tripCountsMap = new Map<string, number>();
  (tripCountsData || []).forEach((tg: { guide_id: string }) => {
    tripCountsMap.set(tg.guide_id, (tripCountsMap.get(tg.guide_id) || 0) + 1);
  });

  // Get all ratings in one query (simplified - ideally join through bookings -> trips -> trip_guides)
  // For now, get ratings for all guides in branch
  const { data: allReviewsData } = await client
    .from('reviews')
    .select('guide_id, guide_rating')
    .in('guide_id', guideIds)
    .not('guide_rating', 'is', null);

  // Calculate average ratings per guide
  const ratingsMap = new Map<string, { sum: number; count: number }>();
  (allReviewsData || []).forEach((r: { guide_id: string; guide_rating: number | null }) => {
    if (r.guide_rating && r.guide_rating > 0) {
      const existing = ratingsMap.get(r.guide_id) || { sum: 0, count: 0 };
      ratingsMap.set(r.guide_id, {
        sum: existing.sum + r.guide_rating,
        count: existing.count + 1,
      });
    }
  });

  // Build leaderboard data
  const leaderboardData: LeaderboardEntry[] = [];

  for (const guide of guides) {
    const tripsCount = tripCountsMap.get(guide.id) || 0;
    const ratingData = ratingsMap.get(guide.id);
    const averageRating = ratingData && ratingData.count > 0
      ? ratingData.sum / ratingData.count
      : 0;
    const totalRatings = ratingData?.count || 0;

    if (tripsCount > 0) {
      leaderboardData.push({
        guideId: guide.id,
        guideName: guide.full_name || 'Guide',
        totalTrips: tripsCount,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        level: calculateLevel(tripsCount),
        rank: 0, // Will be set after sorting
      });
    }
  }

  // Sort by rating (primary) and trips (secondary), then take top 5
  leaderboardData.sort((a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return b.totalTrips - a.totalTrips;
  });

  // Assign ranks and limit to top 5
  const top5 = leaderboardData.slice(0, 5).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

      return {
        leaderboard: top5,
        currentMonth: startDate.toISOString(),
        period,
        selectedDate: period === 'monthly' ? monthParam || undefined : yearParam || undefined,
      };
    }
  );

  return NextResponse.json(result);
});
