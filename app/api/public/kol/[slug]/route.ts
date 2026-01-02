/**
 * Public KOL Trip Detail API
 * GET /api/public/kol/[slug] - Get KOL trip detail by slug
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { slug } = await context.params;

  logger.info('GET /api/public/kol/[slug]', { slug });

  const supabase = await createClient();

  // Get KOL trip with package details
  const { data: kolTrip, error } = await supabase
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
      video_url,
      chat_group_id,
      is_active,
      packages (
        id,
        name,
        slug,
        description,
        destination,
        province,
        duration_days,
        duration_nights,
        thumbnail_url,
        gallery_urls,
        inclusions,
        exclusions,
        itinerary,
        meeting_points,
        min_pax,
        max_pax
      )
    `
    )
    .eq('slug', slug)
    .single();

  if (error || !kolTrip) {
    logger.warn('KOL trip not found', { slug });
    return NextResponse.json({ error: 'KOL trip not found' }, { status: 404 });
  }

  // Check if trip is active and future dated
  const tripDate = new Date(kolTrip.trip_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!kolTrip.is_active || tripDate < today) {
    return NextResponse.json({ error: 'KOL trip is no longer available' }, { status: 410 });
  }

  const pkg = kolTrip.packages as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    destination: string;
    province: string;
    duration_days: number;
    duration_nights: number;
    thumbnail_url: string | null;
    gallery_urls: string[] | null;
    inclusions: string[] | null;
    exclusions: string[] | null;
    itinerary: Array<{
      day: number;
      title: string;
      activities: string[];
    }> | null;
    meeting_points: Array<{
      name: string;
      address: string;
      time: string;
    }> | null;
    min_pax: number;
    max_pax: number;
  } | null;

  const spotsAvailable = kolTrip.max_participants - (kolTrip.current_participants || 0);

  // Transform response
  const tripData = {
    id: kolTrip.id,
    slug: kolTrip.slug,
    kol: {
      name: kolTrip.kol_name,
      handle: kolTrip.kol_handle,
      platform: kolTrip.kol_platform,
      photoUrl: kolTrip.kol_photo_url,
      bio: kolTrip.kol_bio,
    },
    tripDate: kolTrip.trip_date,
    maxParticipants: kolTrip.max_participants,
    currentParticipants: kolTrip.current_participants || 0,
    spotsAvailable,
    isSoldOut: spotsAvailable <= 0,
    pricing: {
      basePrice: kolTrip.base_price,
      kolFee: kolTrip.kol_fee,
      finalPrice: kolTrip.final_price,
    },
    media: {
      heroImageUrl: kolTrip.hero_image_url,
      videoUrl: kolTrip.video_url,
      galleryUrls: pkg?.gallery_urls || [],
    },
    chatGroupId: kolTrip.chat_group_id,
    package: pkg
      ? {
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description,
          destination: pkg.destination,
          province: pkg.province,
          duration: `${pkg.duration_days}D${pkg.duration_nights}N`,
          durationDays: pkg.duration_days,
          durationNights: pkg.duration_nights,
          thumbnailUrl: pkg.thumbnail_url,
          inclusions: pkg.inclusions || [],
          exclusions: pkg.exclusions || [],
          itinerary: pkg.itinerary || [],
          meetingPoints: pkg.meeting_points || [],
          minPax: pkg.min_pax,
          maxPax: pkg.max_pax,
        }
      : null,
  };

  return NextResponse.json({ trip: tripData });
});

