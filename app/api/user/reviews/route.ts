/**
 * User Reviews API
 * POST /api/user/reviews - Submit a review for a completed trip
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
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
      { error: 'Invalid review data', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  logger.info('POST /api/user/reviews', { bookingId: data.bookingId });

  const supabase = await createClient();

  // Get current user with email
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking and verify ownership via customer_email OR created_by
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, package_id, customer_email, created_by')
    .eq('id', data.bookingId)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  if (bookingError || !booking) {
    logger.warn('Booking not found for review', { bookingId: data.bookingId, email: user.email });
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

  // Check if already reviewed (by reviewer_id in package_reviews)
  const { count: existingReview } = await supabase
    .from('package_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', data.bookingId)
    .eq('reviewer_id', user.id);

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
      reviewer_id: user.id,
      reviewer_name: user.user_metadata?.full_name || user.email || 'Anonymous',
      overall_rating: data.rating,
      review_text: sanitizeInput(data.review),
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

  // Note: Package average rating should be updated via database trigger or separate job

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

