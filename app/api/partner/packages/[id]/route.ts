/**
 * API: Partner Package Detail
 * GET /api/partner/packages/[id] - Get package detail with NTA pricing
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { fetchPackageReviews } from '@/lib/partner/package-ratings';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildItineraryDaysFromRows,
  buildItineraryDaysFromJsonb,
  type ItineraryDay,
} from '@/lib/guide/itinerary';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: packageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    const { data: packageData, error } = await client
      .from('packages')
      .select(
        `
        id,
        name,
        description,
        destination,
        province,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        package_type,
        inclusions,
        exclusions,
        thumbnail_url,
        itinerary,
        gallery_urls,
        meeting_point,
        meeting_point_lat,
        meeting_point_lng,
        package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta
        )
      `
      )
      .eq('id', packageId)
      .single();

    if (error || !packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Fetch itinerary - try package_itineraries table first, then fallback to JSONB
    let itineraryDays: ItineraryDay[] = [];

    try {
      const { data: packageItineraries, error: itinerariesError } = await client
        .from('package_itineraries')
        .select('day_number, title, description')
        .eq('package_id', packageId)
        .order('day_number', { ascending: true });

      if (!itinerariesError && packageItineraries && packageItineraries.length > 0) {
        // Successfully fetched from package_itineraries table
        itineraryDays = buildItineraryDaysFromRows(
          packageItineraries as Array<{
            day_number: number;
            title: string | null;
            description: string | null;
          }>,
        );
      } else if (packageData.itinerary) {
        // Fallback to JSONB itinerary from packages table
        itineraryDays = buildItineraryDaysFromJsonb(packageData.itinerary);
      }
    } catch (itineraryError) {
      logger.warn('Failed to fetch itinerary', {
        packageId,
        error: itineraryError instanceof Error ? itineraryError.message : String(itineraryError),
      });
      // Continue without itinerary - not critical
    }

    // Fetch popularity stats
    let popularity = {
      booking_count: 0,
      total_revenue: 0,
      popularity_score: 0,
    };

    try {
      // Use direct query - package_popularity is a view
      const { data: popularityData, error: popularityError } = await (client as any)
        .from('package_popularity')
        .select('booking_count, total_revenue, popularity_score')
        .eq('package_id', packageId)
        .single();

      if (!popularityError && popularityData) {
        popularity = {
          booking_count: popularityData.booking_count || 0,
          total_revenue: popularityData.total_revenue || 0,
          popularity_score: popularityData.popularity_score || 0,
        };
      }
    } catch (popularityError) {
      logger.warn('Failed to fetch popularity stats', {
        packageId,
        error: popularityError instanceof Error ? popularityError.message : String(popularityError),
      });
      // Continue without popularity stats - not critical
    }

    // Fetch reviews and ratings
    let reviews: Array<{
      id: string;
      bookingId: string;
      reviewerName: string;
      overallRating: number;
      guideRating: number | null;
      facilityRating: number | null;
      valueRating: number | null;
      reviewText: string | null;
      createdAt: string;
    }> = [];
    let ratings = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0,
      },
    };

    try {
      const reviewsData = await fetchPackageReviews(client, packageId);
      reviews = reviewsData.reviews;
      ratings = reviewsData.ratings;
    } catch (reviewsError) {
      logger.warn('Failed to fetch reviews', {
        packageId,
        error: reviewsError instanceof Error ? reviewsError.message : String(reviewsError),
      });
      // Continue without reviews - not critical
    }

    return NextResponse.json({
      package: {
        ...packageData,
        itineraryDays,
        popularity,
        reviews,
        ratings,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch package detail', error, {
      packageId,
      userId: user.id,
    });
    throw error;
  }
});

