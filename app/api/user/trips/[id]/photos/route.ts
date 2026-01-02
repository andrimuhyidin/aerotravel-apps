/**
 * Trip Photos API
 * GET /api/user/trips/[id]/photos - Get photos for a trip
 * Photos are blurred unless user has submitted a review
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id: tripId } = await context.params;
  
  logger.info('GET /api/user/trips/[id]/photos', { tripId });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Check if user is a participant in this trip
  const { data: tripBooking, error: bookingError } = await supabase
    .from('trip_bookings')
    .select(`
      id,
      trip_id,
      bookings (
        id,
        user_id,
        customer_name
      )
    `)
    .eq('trip_id', tripId)
    .eq('bookings.user_id', user.id)
    .single();

  if (bookingError || !tripBooking) {
    return NextResponse.json(
      { error: 'You are not a participant of this trip' },
      { status: 403 }
    );
  }

  // Check if user has submitted a review
  const { data: review, error: reviewError } = await supabase
    .from('package_reviews')
    .select('id, rating')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  const hasReview = !reviewError && review !== null;

  // Get trip info
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id,
      trip_code,
      trip_date,
      packages (
        id,
        name,
        destination
      )
    `)
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    );
  }

  // Get photos
  const { data: photos, error: photosError } = await supabase
    .from('trip_photos')
    .select('id, photo_url, thumbnail_url, caption, uploaded_at')
    .eq('trip_id', tripId)
    .order('uploaded_at', { ascending: false });

  if (photosError) {
    logger.error('Failed to fetch trip photos', photosError);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }

  const pkg = trip.packages as { id: string; name: string; destination: string } | null;

  return NextResponse.json({
    tripId,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      destination: pkg.destination,
    } : null,
    hasReview,
    reviewId: review?.id || null,
    unlocked: hasReview,
    photos: (photos || []).map((photo) => ({
      id: photo.id,
      url: hasReview ? photo.photo_url : null,
      thumbnailUrl: hasReview ? photo.thumbnail_url : photo.thumbnail_url, // Show blurred thumbnail
      caption: photo.caption,
      uploadedAt: photo.uploaded_at,
      blurred: !hasReview,
    })),
    totalPhotos: photos?.length || 0,
  });
});

