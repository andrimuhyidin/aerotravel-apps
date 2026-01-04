/**
 * API: Guide Stats & Gamification
 * GET /api/guide/stats - Get guide statistics for badges, levels, and leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import {
  calculateBadges,
  calculateLevel,
  calculateLevelProgress,
  getTripsNeededForNextLevel,
  type GuideStats,
} from '@/lib/guide/gamification';
import {
  awardPoints,
  calculateBadgePoints,
  calculateLevelUpPoints,
} from '@/lib/guide/reward-points';
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

  // Use cache for expensive stats query
  const stats = await getCached(
    cacheKeys.guide.stats(user.id),
    cacheTTL.stats,
    async () => {
      const branchContext = await getBranchContext(user.id);
      const client = supabase as unknown as any;

      // Get user join date from users table
      const { data: userProfile } = await client
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single();

      // Get total completed trips
      const { count: totalTrips, error: tripsError } = await client
        .from('trip_guides')
        .select('*', { count: 'exact', head: true })
        .eq('guide_id', user.id)
        .not('check_in_at', 'is', null)
        .not('check_out_at', 'is', null);

      if (tripsError) {
        logger.error('Failed to count trips', tripsError, { guideId: user.id });
      }

      // Get average rating from reviews
      // Join through: trip_guides -> trip_bookings -> bookings -> reviews
      // This follows the proper relationship chain for accurate rating calculation
      let averageRating = 0;
      let totalRatings = 0;

      try {
        // Step 1: Get trip IDs for this guide (only completed trips)
        const { data: guideTrips } = await client
          .from('trip_guides')
          .select('trip_id')
          .eq('guide_id', user.id)
          .not('check_in_at', 'is', null)
          .not('check_out_at', 'is', null);

        if (guideTrips && guideTrips.length > 0) {
          const tripIds = guideTrips.map(
            (gt: { trip_id: string }) => gt.trip_id
          );

          // Step 2: Get booking IDs for these trips via trip_bookings
          const { data: tripBookings } = await client
            .from('trip_bookings')
            .select('booking_id')
            .in('trip_id', tripIds);

          if (tripBookings && tripBookings.length > 0) {
            const bookingIds = tripBookings.map(
              (tb: { booking_id: string }) => tb.booking_id
            );

            // Step 3: Get reviews for these bookings with guide_rating
            const { data: reviewsData, error: reviewsQueryError } = await client
              .from('reviews')
              .select('guide_rating')
              .in('booking_id', bookingIds)
              .not('guide_rating', 'is', null);

            if (reviewsQueryError) {
              logger.warn('Failed to fetch reviews for stats', {
                guideId: user.id,
                bookingIdsCount: bookingIds.length,
                error: reviewsQueryError,
              });
              // Continue with default values (0 rating)
            } else if (reviewsData) {
              const ratings = reviewsData
                .map((r: { guide_rating: number | null }) => r.guide_rating)
                .filter((r: number | null) => r !== null && r > 0) as number[];

              totalRatings = ratings.length;
              if (ratings.length > 0) {
                averageRating =
                  ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
              }
            }
          }
        }
      } catch (reviewsError) {
        logger.error('Failed to fetch reviews', reviewsError, {
          guideId: user.id,
        });
        // Continue with default values (0 rating)
      }

      // Get complaints count (from tickets or similar)
      // For now, use salary_deductions as proxy for complaints/penalties
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: complaints, error: complaintsError } = await client
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('reported_by', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (complaintsError) {
        logger.error('Failed to count complaints', complaintsError, {
          guideId: user.id,
        });
      }

      // Get penalties count (from salary_deductions)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { count: penalties, error: penaltiesError } = await client
        .from('salary_deductions')
        .select('*', { count: 'exact', head: true })
        .eq('guide_id', user.id)
        .gte('created_at', threeMonthsAgo.toISOString());

      if (penaltiesError) {
        logger.error('Failed to count penalties', penaltiesError, {
          guideId: user.id,
        });
      }

      // Calculate level and badges
      const totalTripsCount = totalTrips || 0;
      const calculatedLevel = calculateLevel(totalTripsCount);
      const levelProgress = calculateLevelProgress(
        totalTripsCount,
        calculatedLevel
      );
      const nextLevelTripsRequired = getTripsNeededForNextLevel(
        totalTripsCount,
        calculatedLevel
      );
      const badges = calculateBadges({
        totalTrips: totalTripsCount,
        averageRating,
        totalRatings,
        complaints: complaints || 0,
        penalties: penalties || 0,
      });

      // Award points for newly earned badges
      // Check which badges were already awarded points by checking transaction history
      const { data: existingBadgeTransactions } = await client
        .from('guide_reward_transactions')
        .select('source_id, metadata')
        .eq('guide_id', user.id)
        .eq('source_type', 'badge');

      const awardedBadgeIds = new Set(
        (existingBadgeTransactions || [])
          .map((t: { source_id: string | null; metadata: any }) => {
            // Check metadata for badge_id or use source_id
            return t.metadata?.badge_id || t.source_id;
          })
          .filter(Boolean)
      );

      // Award points for badges that are earned but not yet awarded
      for (const badge of badges) {
        if (badge.earned && !awardedBadgeIds.has(badge.id)) {
          const points = calculateBadgePoints(badge.id);
          await awardPoints(
            user.id,
            points,
            'badge',
            undefined, // Don't pass badge.id as source_id (it's a string, not UUID)
            `Badge earned: ${badge.name}`,
            { badge_id: badge.id, badge_name: badge.name }
          );
        }
      }

      // Check for level up and award points
      const previousLevel = await (async () => {
        // Get previous level from cache or calculate from previous trip count
        // For simplicity, we'll check if level up points were already awarded
        const { data: levelUpTransactions } = await client
          .from('guide_reward_transactions')
          .select('metadata')
          .eq('guide_id', user.id)
          .eq('source_type', 'level_up')
          .order('created_at', { ascending: false })
          .limit(1);

        if (levelUpTransactions && levelUpTransactions.length > 0) {
          return levelUpTransactions[0].metadata?.from_level || 'bronze';
        }
        return 'bronze'; // Default to bronze if no previous level
      })();

      const currentLevel = calculateLevel(totalTripsCount);
      if (previousLevel !== currentLevel) {
        // Level up detected - award points
        const points = calculateLevelUpPoints(previousLevel, currentLevel);
        if (points > 0) {
          await awardPoints(
            user.id,
            points,
            'level_up',
            undefined,
            `Level up: ${previousLevel} → ${currentLevel}`,
            { from_level: previousLevel, to_level: currentLevel }
          );
        }
      }

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
        joinDate:
          (userProfile as { created_at?: string } | null)?.created_at ||
          undefined,
      };

      return stats;
    }
  );

  // Return stats directly (not wrapped in data property for consistency with component expectations)
  return NextResponse.json(stats);
});
