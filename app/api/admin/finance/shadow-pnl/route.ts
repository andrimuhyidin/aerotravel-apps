/**
 * API: Shadow P&L List
 * GET /api/admin/finance/shadow-pnl
 * Returns list of trips with P&L data
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateTripPnL,
  DEFAULT_COST_STRUCTURE,
  type TripPnL,
} from '@/lib/finance/shadow-pnl';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const packageId = searchParams.get('packageId');

  try {
    // Build query
    let query = supabase
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        status,
        package_id,
        packages(id, name, trip_type)
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['confirmed', 'completed', 'in_progress', 'cancelled']);
    }

    if (startDate) {
      query = query.gte('trip_date', startDate);
    }

    if (endDate) {
      query = query.lte('trip_date', endDate);
    }

    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .order('trip_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: trips, error: tripsError, count } = await query;

    if (tripsError) {
      logger.error('Failed to fetch trips for shadow P&L', tripsError);
      throw tripsError;
    }

    // Fetch bookings via trip_bookings junction table
    const tripIds = trips?.map((t) => t.id) || [];
    let bookings: unknown[] = [];

    if (tripIds.length > 0) {
      const { data: tripBookingsData, error: tripBookingsError } = await supabase
        .from('trip_bookings')
        .select(`
          trip_id,
          bookings(id, booking_code, adult_pax, child_pax, total_amount, discount_amount, status)
        `)
        .in('trip_id', tripIds);

      if (tripBookingsError) {
        logger.error('Failed to fetch bookings for shadow P&L', tripBookingsError);
        throw tripBookingsError;
      }

      // Flatten bookings and add trip_id reference
      bookings = (tripBookingsData || [])
        .filter((tb) => tb.bookings)
        .map((tb) => ({
          ...(tb.bookings as object),
          trip_id: tb.trip_id,
          pax_count: ((tb.bookings as { adult_pax?: number })?.adult_pax || 0) + 
                     ((tb.bookings as { child_pax?: number })?.child_pax || 0),
          total_price: (tb.bookings as { total_amount?: number })?.total_amount || 0,
        }));
    }

    // Generate P&L for each trip
    const tripPnLs: TripPnL[] = (trips || []).map((trip) => {
      const pkg = trip.packages as { id: string; name: string; trip_type?: string } | null;
      const tripType = pkg?.trip_type || 'boat_trip';
      const costs = DEFAULT_COST_STRUCTURE[tripType] || DEFAULT_COST_STRUCTURE['boat_trip'];
      
      // Filter bookings for this trip
      const tripBookings = (bookings as Array<{ trip_id: string }>).filter((b) => b.trip_id === trip.id);
      
      // Map trip structure to match generateTripPnL expectations
      const tripData = {
        ...trip,
        start_date: trip.trip_date,
        end_date: trip.trip_date,
      };

      return generateTripPnL(tripData, tripBookings as unknown[], costs, pkg?.name || 'Unknown Package');
    });

    logger.info('Shadow P&L list fetched', {
      userId: user.id,
      tripCount: tripPnLs.length,
      page,
      limit,
    });

    return NextResponse.json({
      trips: tripPnLs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Shadow P&L list error', error, { userId: user.id });
    throw error;
  }
});

