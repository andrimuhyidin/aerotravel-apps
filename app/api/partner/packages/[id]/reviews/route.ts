/**
 * API: Package Reviews
 * GET /api/partner/packages/[id]/reviews - Get reviews with stats from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type ReviewRow = {
  id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  overall_rating: number;
  itinerary_rating: number | null;
  guide_rating: number | null;
  accommodation_rating: number | null;
  transport_rating: number | null;
  value_rating: number | null;
  review_text: string | null;
  review_title: string | null;
  photos: string[] | null;
  trip_date: string | null;
  travel_with: string | null;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
};

type RatingStatsRow = {
  total_reviews: number;
  average_rating: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const searchParams = sanitizeSearchParams(request);
  const sort = searchParams.get('sort') || 'recent'; // recent, highest, lowest, helpful
  const rating = searchParams.get('rating'); // filter by specific rating (1-5)
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const { id: packageId } = await params;

  try {
    // Build query for reviews
    let query = client
      .from('package_reviews')
      .select(`
        id,
        reviewer_name,
        reviewer_avatar,
        overall_rating,
        itinerary_rating,
        guide_rating,
        accommodation_rating,
        transport_rating,
        value_rating,
        review_text,
        review_title,
        photos,
        trip_date,
        travel_with,
        helpful_count,
        verified_purchase,
        created_at
      `)
      .eq('package_id', packageId)
      .eq('status', 'approved')
      .is('deleted_at', null);

    // Filter by rating if specified
    if (rating) {
      const ratingValue = parseInt(rating);
      if (ratingValue >= 1 && ratingValue <= 5) {
        query = query.eq('overall_rating', ratingValue);
      }
    }

    // Apply sorting
    switch (sort) {
      case 'highest':
        query = query.order('overall_rating', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'lowest':
        query = query.order('overall_rating', { ascending: true }).order('created_at', { ascending: false });
        break;
      case 'helpful':
        query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Get total count for pagination (before applying limit/offset)
    const { count: totalCount, error: countError } = await client
      .from('package_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('package_id', packageId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .then((res: { count: number | null; error: unknown }) => {
        if (rating) {
          // Need to filter count by rating too
          return client
            .from('package_reviews')
            .select('id', { count: 'exact', head: true })
            .eq('package_id', packageId)
            .eq('status', 'approved')
            .is('deleted_at', null)
            .eq('overall_rating', parseInt(rating));
        }
        return res;
      });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      logger.error('Failed to fetch reviews from database', { error: reviewsError, packageId });
      throw reviewsError;
    }

    // Get aggregated stats from materialized view
    const { data: statsData, error: statsError } = await client
      .from('package_rating_stats')
      .select('total_reviews, average_rating, rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count')
      .eq('package_id', packageId)
      .maybeSingle();

    // Fallback stats if materialized view is empty or doesn't have this package
    let stats: RatingStatsRow = {
      total_reviews: 0,
      average_rating: 0,
      rating_5_count: 0,
      rating_4_count: 0,
      rating_3_count: 0,
      rating_2_count: 0,
      rating_1_count: 0,
    };

    if (statsData && !statsError) {
      stats = statsData as RatingStatsRow;
    } else if (!statsData) {
      // Calculate stats manually if materialized view doesn't have data
      const { data: manualStats } = await client
        .from('package_reviews')
        .select('overall_rating')
        .eq('package_id', packageId)
        .eq('status', 'approved')
        .is('deleted_at', null);

      if (manualStats && manualStats.length > 0) {
        const ratings = manualStats as Array<{ overall_rating: number }>;
        stats.total_reviews = ratings.length;
        stats.average_rating = ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length;
        stats.rating_5_count = ratings.filter(r => r.overall_rating === 5).length;
        stats.rating_4_count = ratings.filter(r => r.overall_rating === 4).length;
        stats.rating_3_count = ratings.filter(r => r.overall_rating === 3).length;
        stats.rating_2_count = ratings.filter(r => r.overall_rating === 2).length;
        stats.rating_1_count = ratings.filter(r => r.overall_rating === 1).length;
      }
    }

    // Transform reviews for response
    const transformedReviews = (reviews as ReviewRow[] || []).map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      reviewer_avatar: r.reviewer_avatar,
      overall_rating: r.overall_rating,
      ratings: {
        itinerary: r.itinerary_rating,
        guide: r.guide_rating,
        accommodation: r.accommodation_rating,
        transport: r.transport_rating,
        value: r.value_rating,
      },
      review_text: r.review_text,
      review_title: r.review_title,
      photos: r.photos || [],
      trip_date: r.trip_date,
      travel_with: r.travel_with,
      helpful_count: r.helpful_count,
      verified_purchase: r.verified_purchase,
      created_at: r.created_at,
    }));

    const filteredTotal = rating ? (totalCount ?? transformedReviews.length) : stats.total_reviews;

    logger.info('Fetched package reviews', {
      packageId,
      reviewCount: transformedReviews.length,
      totalReviews: stats.total_reviews,
    });

    return NextResponse.json({
      reviews: transformedReviews,
      stats: {
        averageRating: Number(stats.average_rating) || 0,
        totalReviews: stats.total_reviews,
        ratingBreakdown: {
          '5': stats.rating_5_count,
          '4': stats.rating_4_count,
          '3': stats.rating_3_count,
          '2': stats.rating_2_count,
          '1': stats.rating_1_count,
        },
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reviews', error, { packageId });
    throw error;
  }
});
