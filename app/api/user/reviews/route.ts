/**
 * User Reviews API
 * POST /api/user/reviews - Submit a review for a completed trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/utils/sanitize';
import { logger } from '@/lib/utils/logger';

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  review: z.string().min(10).max(1000),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  
  // Validate input
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  logger.info('POST /api/user/reviews', { bookingId: data.bookingId });

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking and verify ownership
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, package_id, user_id')
    .eq('id', data.bookingId)
    .eq('user_id', user.id)
    .single();

  if (bookingError || !booking) {
    logger.warn('Booking not found for review', { bookingId: data.bookingId });
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Check if trip is completed
  if (booking.status !== 'completed') {
    return NextResponse.json(
      { error: 'Review only available for completed trips' },
      { status: 400 }
    );
  }

  // Check if already reviewed
  const { count: existingReview } = await supabase
    .from('package_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', data.bookingId)
    .eq('user_id', user.id);

  if (existingReview && existingReview > 0) {
    return NextResponse.json(
      { error: 'You have already reviewed this trip' },
      { status: 400 }
    );
  }

  // Create review
  const { data: review, error: reviewError } = await supabase
    .from('package_reviews')
    .insert({
      package_id: booking.package_id,
      booking_id: data.bookingId,
      user_id: user.id,
      rating: data.rating,
      review: sanitizeInput(data.review),
      status: 'published', // Auto-publish, can add moderation later
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (reviewError) {
    logger.error('Failed to create review', reviewError);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }

  // Update package average rating (trigger can also do this)
  await updatePackageRating(supabase, booking.package_id);

  logger.info('Review submitted successfully', { 
    reviewId: review.id,
    bookingId: data.bookingId,
    rating: data.rating,
  });

  return NextResponse.json({
    id: review.id,
    message: 'Review submitted successfully',
  }, { status: 201 });
});

async function updatePackageRating(supabase: Awaited<ReturnType<typeof createClient>>, packageId: string) {
  try {
    // Calculate new average
    const { data: reviews } = await supabase
      .from('package_reviews')
      .select('rating')
      .eq('package_id', packageId)
      .eq('status', 'published');

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const reviewCount = reviews.length;

      await supabase
        .from('packages')
        .update({
          average_rating: Math.round(avgRating * 10) / 10,
          review_count: reviewCount,
        })
        .eq('id', packageId);
    }
  } catch (error) {
    logger.error('Failed to update package rating', error);
  }
}

