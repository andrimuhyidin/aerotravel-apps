/**
 * Public KOL Trips List API
 * GET /api/public/kol - Get all active KOL trips
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/public/kol');

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Query params
  const platform = searchParams.get('platform'); // instagram, tiktok, youtube
  const destination = searchParams.get('destination');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Base query - only active trips with future dates
  let query = supabase
    .from('kol_trips')
    .select(
      `
      id,
      slug,
      kol_name,
      kol_handle,
      kol_platform,
      kol_photo_url,
      kol_bio,
      trip_date,
      max_participants,
      current_participants,
      base_price,
      kol_fee,
      final_price,
      hero_image_url,
      is_active,
      packages (
        id,
        name,
        slug,
        destination,
        province,
        duration_days,
        duration_nights,
        thumbnail_url
      )
    `,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .gte('trip_date', new Date().toISOString().split('T')[0])
    .order('trip_date', { ascending: true });

  // Apply filters
  if (platform) {
    query = query.eq('kol_platform', platform);
  }

  if (destination) {
    query = query.ilike('packages.destination', `%${destination}%`);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: kolTrips, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch KOL trips', error);
    return NextResponse.json({ error: 'Failed to fetch KOL trips' }, { status: 500 });
  }

  // Transform data
  const trips = (kolTrips || []).map((trip) => {
    const pkg = trip.packages as {
      id: string;
      name: string;
      slug: string;
      destination: string;
      province: string;
      duration_days: number;
      duration_nights: number;
      thumbnail_url: string | null;
    } | null;

    return {
      id: trip.id,
      slug: trip.slug,
      kol: {
        name: trip.kol_name,
        handle: trip.kol_handle,
        platform: trip.kol_platform,
        photoUrl: trip.kol_photo_url,
        bio: trip.kol_bio,
      },
      tripDate: trip.trip_date,
      maxParticipants: trip.max_participants,
      currentParticipants: trip.current_participants,
      spotsAvailable: trip.max_participants - (trip.current_participants || 0),
      pricing: {
        basePrice: trip.base_price,
        kolFee: trip.kol_fee,
        finalPrice: trip.final_price,
      },
      heroImageUrl: trip.hero_image_url,
      package: pkg
        ? {
            id: pkg.id,
            name: pkg.name,
            slug: pkg.slug,
            destination: pkg.destination,
            province: pkg.province,
            duration: `${pkg.duration_days}D${pkg.duration_nights}N`,
            thumbnailUrl: pkg.thumbnail_url,
          }
        : null,
    };
  });

  return NextResponse.json({
    trips,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    },
  });
});

