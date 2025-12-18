/**
 * API: Guide Stats & Gamification
 * GET /api/guide/stats - Get guide statistics for badges, levels, and leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import {
    calculateBadges,
    calculateLevel,
    calculateLevelProgress,
    getTripsNeededForNextLevel,
    type GuideStats
} from '@/lib/guide/gamification';
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

  // Get user join date from users table
  const { data: userProfile } = await withBranchFilter(
    client.from('users'),
    branchContext,
  )
    .select('created_at')
    .eq('id', user.id)
    .single();

  // Get total completed trips
  const { count: totalTrips, error: tripsError } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', user.id)
    .not('check_in_at', 'is', null)
    .not('check_out_at', 'is', null);

  if (tripsError) {
    logger.error('Failed to count trips', tripsError, { guideId: user.id });
  }

  // Get average rating from reviews
  // Simplified: Get reviews and filter by guide through bookings -> trip_bookings -> trips -> trip_guides
  // For now, we'll use a simpler approach: get all reviews with guide_rating and calculate
  // TODO: Proper join through bookings -> trip_bookings -> trips -> trip_guides
  let averageRating = 0;
  let totalRatings = 0;

  try {
    // Get trip IDs for this guide
    const { data: guideTrips } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('trip_id')
      .eq('guide_id', user.id);

    if (guideTrips && guideTrips.length > 0) {
      const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);

      // Get bookings for these trips
      const { data: tripBookings } = await withBranchFilter(
        client.from('trip_bookings'),
        branchContext,
      )
        .select('booking_id')
        .in('trip_id', tripIds);

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

        // Get reviews for these bookings
        const { data: reviewsData } = await client
          .from('reviews')
          .select('guide_rating')
          .in('booking_id', bookingIds)
          .not('guide_rating', 'is', null);

        if (reviewsData) {
          const ratings = reviewsData
            .map((r: { guide_rating: number | null }) => r.guide_rating)
            .filter((r: number | null) => r !== null && r > 0) as number[];

          totalRatings = ratings.length;
          if (ratings.length > 0) {
            averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          }
        }
      }
    }
  } catch (reviewsError) {
    logger.error('Failed to fetch reviews', reviewsError, { guideId: user.id });
    // Continue with default values (0 rating)
  }

  // Get complaints count (from tickets or similar)
  // For now, use salary_deductions as proxy for complaints/penalties
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: complaints, error: complaintsError } = await withBranchFilter(
    client.from('tickets'),
    branchContext,
  )
    .select('*', { count: 'exact', head: true })
    .eq('reported_by', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (complaintsError) {
    logger.error('Failed to count complaints', complaintsError, { guideId: user.id });
  }

  // Get penalties count (from salary_deductions)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { count: penalties, error: penaltiesError } = await withBranchFilter(
    client.from('salary_deductions'),
    branchContext,
  )
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', user.id)
    .gte('created_at', threeMonthsAgo.toISOString());

  if (penaltiesError) {
    logger.error('Failed to count penalties', penaltiesError, { guideId: user.id });
  }

  // Calculate level and badges
  const totalTripsCount = totalTrips || 0;
  const currentLevel = calculateLevel(totalTripsCount);
  const levelProgress = calculateLevelProgress(totalTripsCount, currentLevel);
  const nextLevelTripsRequired = getTripsNeededForNextLevel(totalTripsCount, currentLevel);
  const badges = calculateBadges({
    totalTrips: totalTripsCount,
    averageRating,
    totalRatings,
    complaints: complaints || 0,
    penalties: penalties || 0,
  });

  const stats: GuideStats & { joinDate?: string } = {
    totalTrips: totalTripsCount,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalRatings,
    complaints: complaints || 0,
    penalties: penalties || 0,
    currentLevel,
    currentLevelProgress: levelProgress,
    nextLevelTripsRequired,
    badges: badges.filter((b) => b.earned), // Only return earned badges
    joinDate: (userProfile as { created_at?: string } | null)?.created_at || undefined,
  };

  return NextResponse.json(stats);
});
