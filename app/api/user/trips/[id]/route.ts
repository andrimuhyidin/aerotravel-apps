/**
 * User Trip Detail API
 * GET /api/user/trips/[id] - Get trip detail for current user
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;
  
  logger.info('GET /api/user/trips/[id]', { id });

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking with package details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      status,
      special_requests,
      customer_name,
      customer_phone,
      customer_email,
      created_at,
      paid_at,
      packages (
        id,
        name,
        slug,
        destination,
        province,
        duration_days,
        duration_nights,
        inclusions,
        exclusions,
        meeting_points
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !booking) {
    logger.warn('Trip not found', { id, userId: user.id });
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    );
  }

  // Check if user has reviewed this trip
  const { count: reviewCount } = await supabase
    .from('package_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', id)
    .eq('user_id', user.id);

  const pkg = booking.packages as {
    id: string;
    name: string;
    slug: string;
    destination: string;
    province: string;
    duration_days: number;
    duration_nights: number;
    inclusions: string[];
    exclusions: string[];
    meeting_points: { name: string; address: string; time: string }[];
  } | null;

  const transformedTrip = {
    id: booking.id,
    code: booking.code,
    tripDate: booking.trip_date,
    adultPax: booking.adult_pax || 0,
    childPax: booking.child_pax || 0,
    infantPax: booking.infant_pax || 0,
    totalPax: (booking.adult_pax || 0) + (booking.child_pax || 0) + (booking.infant_pax || 0),
    totalAmount: booking.total_amount,
    status: booking.status,
    specialRequests: booking.special_requests,
    bookerName: booking.customer_name,
    bookerPhone: booking.customer_phone,
    bookerEmail: booking.customer_email,
    createdAt: booking.created_at,
    paidAt: booking.paid_at,
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      destination: pkg.destination,
      province: pkg.province,
      duration: `${pkg.duration_days}D${pkg.duration_nights}N`,
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      meetingPoints: pkg.meeting_points || [],
    } : null,
    hasReview: (reviewCount || 0) > 0,
  };

  return NextResponse.json({ trip: transformedTrip });
});

