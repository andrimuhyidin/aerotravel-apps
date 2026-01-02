/**
 * Trip Review API
 * POST /api/user/trips/[id]/review - Submit a review for a trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(10).max(1000),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id: tripId } = await context.params;
  const body = await request.json();
  
  logger.info('POST /api/user/trips/[id]/review', { tripId });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate input
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review data', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { rating, review } = parsed.data;

  const supabase = await createClient();

  // Check if user is a participant
  const { data: tripBooking, error: bookingError } = await supabase
    .from('trip_bookings')
    .select(`
      id,
      trip_id,
      booking_id,
      bookings (
        id,
        user_id,
        package_id
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

  const booking = tripBooking.bookings as { id: string; user_id: string; package_id: string } | null;
  const packageId = booking?.package_id;

  if (!packageId) {
    return NextResponse.json(
      { error: 'Package not found for this trip' },
      { status: 400 }
    );
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('package_reviews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (existingReview) {
    return NextResponse.json(
      { error: 'You have already reviewed this trip' },
      { status: 400 }
    );
  }

  // Create review
  const { data: newReview, error: reviewError } = await supabase
    .from('package_reviews')
    .insert({
      package_id: packageId,
      trip_id: tripId,
      user_id: user.id,
      booking_id: booking?.id,
      rating,
      review,
      status: 'published',
    })
    .select()
    .single();

  if (reviewError || !newReview) {
    logger.error('Failed to create review', reviewError);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }

  // Update package average rating
  const { data: reviews } = await supabase
    .from('package_reviews')
    .select('rating')
    .eq('package_id', packageId)
    .eq('status', 'published');

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await supabase
      .from('packages')
      .update({
        average_rating: avgRating,
        review_count: reviews.length,
      })
      .eq('id', packageId);
  }

  return NextResponse.json({
    success: true,
    reviewId: newReview.id,
    message: 'Review submitted successfully! Photos are now unlocked.',
  });
});

