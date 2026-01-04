/**
 * User Bookings API
 * GET /api/user/bookings - Get current user's bookings
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
 * This allows customers to view their bookings even when created by partners
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status'); // upcoming, completed, all
  const limit = parseInt(searchParams.get('limit') || '10');

  logger.info('GET /api/user/bookings', { status, limit });

  const supabase = await createClient();

  // Get current user with email
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Query bookings by customer_email OR created_by (for both partner-created and self-created bookings)
  let query = supabase
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
      created_at,
      package_id
    `)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .order('trip_date', { ascending: true })
    .limit(limit);

  // Filter by status type
  const today = new Date().toISOString().split('T')[0];
  
  if (status === 'upcoming') {
    query = query
      .gte('trip_date', today)
      .in('status', ['pending_payment', 'paid', 'confirmed']);
  } else if (status === 'completed') {
    query = query
      .or(`trip_date.lt.${today},status.eq.completed`);
  }

  const { data: bookings, error } = await query;

  if (error) {
    logger.error('Failed to fetch user bookings', error, { userId: user.id, email: user.email });
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }

  // Fetch packages separately to avoid relation issues
  const packageIds = [...new Set((bookings || []).map(b => b.package_id).filter(Boolean))];
  let packagesMap: Record<string, { id: string; name: string; slug: string; destination: string; duration_days: number; duration_nights: number }> = {};
  
  if (packageIds.length > 0) {
    const { data: packages } = await supabase
      .from('packages')
      .select('id, name, slug, destination, duration_days, duration_nights')
      .in('id', packageIds);
    
    if (packages) {
      packagesMap = Object.fromEntries(packages.map(p => [p.id, p]));
    }
  }

  // Transform data
  const transformedBookings = (bookings || []).map((b) => {
    const pkg = b.package_id ? packagesMap[b.package_id] : null;

    return {
      id: b.id,
      code: b.booking_code, // Use booking_code from DB, but expose as 'code' for frontend compatibility
      tripDate: b.trip_date,
      totalPax: (b.adult_pax || 0) + (b.child_pax || 0) + (b.infant_pax || 0),
      totalAmount: b.total_amount,
      status: b.status,
      createdAt: b.created_at,
      package: pkg ? {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        destination: pkg.destination,
        duration: `${pkg.duration_days}D${pkg.duration_nights}N`,
      } : null,
    };
  });

  return NextResponse.json({
    bookings: transformedBookings,
    total: transformedBookings.length,
  });
});
