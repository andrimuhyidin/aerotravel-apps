/**
 * User Trip Detail API
 * GET /api/user/trips/[id] - Get trip detail for current user
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
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

  // Get current user with email
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get booking - verify ownership via customer_email OR created_by
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
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
      package_id
    `)
    .eq('id', id)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  if (error || !booking) {
    logger.warn('Trip not found', { id, userId: user.id, email: user.email });
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    );
  }

  // Fetch package separately
  type PackageData = {
    id: string;
    name: string;
    slug: string;
    destination: string;
    province: string | null;
    duration_days: number;
    duration_nights: number;
    inclusions: string[] | null;
    exclusions: string[] | null;
  };

  let pkg: PackageData | null = null;

  if (booking.package_id) {
    const { data: packageData } = await supabase
      .from('packages')
      .select('id, name, slug, destination, province, duration_days, duration_nights, inclusions, exclusions')
      .eq('id', booking.package_id)
      .single();
    
    pkg = packageData as PackageData;
  }

  // Check if user has reviewed this trip (by booking_id and reviewer email match)
  const { count: reviewCount } = await supabase
    .from('package_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', id);

  const transformedTrip = {
    id: booking.id,
    code: booking.booking_code,
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
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      destination: pkg.destination,
      province: pkg.province || '',
      duration: `${pkg.duration_days}D${pkg.duration_nights}N`,
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
    } : null,
    hasReview: (reviewCount || 0) > 0,
  };

  return NextResponse.json({ trip: transformedTrip });
});
