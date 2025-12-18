/**
 * API: Guide Ratings
 * GET /api/guide/ratings - Get ratings and reviews for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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

  try {
    // Get trip IDs for this guide
    const { data: guideTrips } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('trip_id')
      .eq('guide_id', user.id);

    if (!guideTrips || guideTrips.length === 0) {
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
      });
    }

    const tripIds = guideTrips.map((gt: { trip_id: string }) => gt.trip_id);

    // Get bookings for these trips
    const { data: tripBookings } = await withBranchFilter(
      client.from('trip_bookings'),
      branchContext,
    )
      .select('booking_id')
      .in('trip_id', tripIds);

    if (!tripBookings || tripBookings.length === 0) {
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
      });
    }

    const bookingIds = tripBookings.map((tb: { booking_id: string }) => tb.booking_id);

    // Get reviews for these bookings
    const { data: reviewsData } = await client
      .from('reviews')
      .select('id, booking_id, reviewer_name, guide_rating, overall_rating, review_text, created_at')
      .in('booking_id', bookingIds)
      .not('guide_rating', 'is', null)
      .order('created_at', { ascending: false });

    const reviews =
      reviewsData?.map((r: any) => ({
        id: r.id,
        bookingId: r.booking_id,
        reviewerName: r.reviewer_name,
        guideRating: r.guide_rating,
        overallRating: r.overall_rating,
        reviewText: r.review_text,
        createdAt: r.created_at,
      })) || [];

    // Calculate summary
    const ratings = reviews
      .map((r: { guideRating: number | null; overallRating: number }) => r.guideRating || r.overallRating)
      .filter((r: number | null): r is number => r !== null && r > 0);

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / totalRatings : 0;

    // Rating distribution
    const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    ratings.forEach((rating: number) => {
      const rounded = Math.round(rating);
      const key = String(rounded) as keyof typeof distribution;
      if (key in distribution) {
        distribution[key]++;
      }
    });

    // Calculate trend (compare last 10 with previous 10)
    let trend: 'up' | 'down' | 'stable' | undefined;
    let recentAverageRating: number | undefined;

    if (ratings.length >= 10) {
      const recent10 = ratings.slice(0, 10);
      const previous10 = ratings.slice(10, 20);
      
      recentAverageRating = recent10.reduce((sum: number, r: number) => sum + r, 0) / recent10.length;
      
      if (previous10.length > 0) {
        const previousAverage = previous10.reduce((sum: number, r: number) => sum + r, 0) / previous10.length;
        const diff = recentAverageRating - previousAverage;
        
        if (diff > 0.2) {
          trend = 'up';
        } else if (diff < -0.2) {
          trend = 'down';
        } else {
          trend = 'stable';
        }
      }
    } else if (ratings.length > 0) {
      recentAverageRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
    }

    return NextResponse.json({
      reviews,
      summary: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        ratingDistribution: distribution,
        recentAverageRating: recentAverageRating ? Math.round(recentAverageRating * 10) / 10 : undefined,
        trend,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch guide ratings', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
});
