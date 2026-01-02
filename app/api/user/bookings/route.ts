/**
 * User Bookings API
 * GET /api/user/bookings - Get current user's bookings
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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let query = supabase
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
      created_at,
      packages (
        id,
        name,
        slug,
        destination,
        duration_days,
        duration_nights
      )
    `)
    .eq('user_id', user.id)
    .order('trip_date', { ascending: true })
    .limit(limit);

  // Filter by status type
  const today = new Date().toISOString().split('T')[0];
  
  if (status === 'upcoming') {
    query = query
      .gte('trip_date', today)
      .in('status', ['pending', 'paid', 'confirmed']);
  } else if (status === 'completed') {
    query = query
      .or(`trip_date.lt.${today},status.eq.completed`);
  }

  const { data: bookings, error } = await query;

  if (error) {
    logger.error('Failed to fetch user bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }

  // Transform data
  const transformedBookings = (bookings || []).map((b) => {
    const pkg = b.packages as {
      id: string;
      name: string;
      slug: string;
      destination: string;
      duration_days: number;
      duration_nights: number;
    } | null;

    return {
      id: b.id,
      code: b.code,
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

