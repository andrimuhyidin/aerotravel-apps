/**
 * API: Guide Ratings
 * GET /api/guide/ratings - Get ratings and reviews for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

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
    // Get trip IDs for this guide
    let guideTripsQuery = client.from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      guideTripsQuery = guideTripsQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: guideTrips, error: guideTripsError } = await guideTripsQuery;

    if (guideTripsError) {
      logger.error('Failed to fetch guide trips for ratings', guideTripsError, {
        guideId: user.id,
        errorCode: guideTripsError.code,
        errorMessage: guideTripsError.message,
      });
      // Return empty reviews instead of failing
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
      });
    }

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
    let tripBookingsQuery = client.from('trip_bookings')
      .select('booking_id')
      .in('trip_id', tripIds);
    
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      tripBookingsQuery = tripBookingsQuery.eq('branch_id', branchContext.branchId);
    }
    
    const { data: tripBookings, error: tripBookingsError } = await tripBookingsQuery;

    if (tripBookingsError) {
      logger.error('Failed to fetch trip bookings for ratings', tripBookingsError, {
        guideId: user.id,
        tripIdsCount: tripIds.length,
        errorCode: tripBookingsError.code,
        errorMessage: tripBookingsError.message,
      });
      // Return empty reviews instead of failing
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
      });
    }

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
    // Note: reviews table may not have branch_id, RLS should handle access
    const { data: reviewsData, error: reviewsError } = await client
      .from('reviews')
      .select('id, booking_id, reviewer_name, guide_rating, overall_rating, review_text, created_at')
      .in('booking_id', bookingIds)
      .not('guide_rating', 'is', null)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      // Check if it's an RLS/permission error
      const isRlsError = 
        reviewsError.code === 'PGRST301' || 
        reviewsError.code === '42501' ||
        reviewsError.message?.toLowerCase().includes('permission') ||
        reviewsError.message?.toLowerCase().includes('policy') ||
        reviewsError.message?.toLowerCase().includes('row-level security');
      
      logger.error('Failed to fetch reviews', reviewsError, {
        guideId: user.id,
        bookingIdsCount: bookingIds.length,
        errorCode: reviewsError.code,
        errorMessage: reviewsError.message,
        errorDetails: reviewsError.details,
        errorHint: reviewsError.hint,
        isRlsError,
      });
      
      // If RLS error, return empty (expected - RLS policy may not be active)
      // Otherwise, return empty as well (better UX than 500)
      if (isRlsError) {
        logger.warn('RLS error detected for reviews - returning empty array', {
          guideId: user.id,
          hint: 'Check if RLS policy is active for reviews table',
        });
      }
      
      // Return empty reviews instead of failing
      return NextResponse.json({
        reviews: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        },
      });
    }

    const reviews =
      (reviewsData || []).map((r: {
        id: string;
        booking_id: string;
        reviewer_name: string | null;
        guide_rating: number | null;
        overall_rating: number | null;
        review_text: string | null;
        created_at: string;
      }) => ({
        id: r.id,
        bookingId: r.booking_id,
        reviewerName: r.reviewer_name || 'Anonymous',
        guideRating: r.guide_rating,
        overallRating: r.overall_rating,
        reviewText: r.review_text,
        createdAt: r.created_at,
      }));

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
