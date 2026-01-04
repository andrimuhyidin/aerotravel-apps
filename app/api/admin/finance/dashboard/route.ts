/**
 * API: Finance Dashboard
 * GET /api/admin/finance/dashboard
 * Returns P&L summary and trip data for finance dashboard
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateTripPnL,
  generatePnLSummary,
  DEFAULT_COST_STRUCTURE,
  type TripPnL,
} from '@/lib/finance/shadow-pnl';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Use regular client for auth
  const authClient = await createClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check authorization using user metadata
  const userRole = user.user_metadata?.role as string;
  const allowedRoles = ['super_admin', 'ops_admin', 'finance_manager'];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use admin client for data queries
  const supabase = await createAdminClient();

  // Get query params
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month'; // month, quarter, year
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      switch (period) {
        case 'quarter':
          dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    // Fetch trips with packages
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        status,
        package_id,
        packages(id, name, trip_type)
      `)
      .gte('trip_date', dateFromStr)
      .lte('trip_date', dateToStr)
      .in('status', ['scheduled', 'preparing', 'on_the_way', 'on_trip', 'completed'])
      .order('trip_date', { ascending: false });

    if (tripsError) {
      logger.error('Failed to fetch trips for finance dashboard', tripsError);
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
        logger.error('Failed to fetch bookings for finance dashboard', tripBookingsError);
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

    // Generate summary
    const periodLabel = `${dateFromStr} - ${dateToStr}`;
    const summary = generatePnLSummary(tripPnLs, periodLabel);

    // Calculate monthly trends (last 6 months)
    const monthlyTrends: Array<{
      month: string;
      revenue: number;
      cost: number;
      profit: number;
      trips: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      const monthTrips = tripPnLs.filter((t) => {
        const tripDate = new Date(t.startDate);
        return tripDate >= monthDate && tripDate <= monthEnd;
      });

      const monthSummary = generatePnLSummary(monthTrips, monthLabel);
      monthlyTrends.push({
        month: monthLabel,
        revenue: monthSummary.totalRevenue,
        cost: monthSummary.totalCost,
        profit: monthSummary.totalProfit,
        trips: monthSummary.totalTrips,
      });
    }

    // Top performing trips by margin
    const topTrips = [...tripPnLs]
      .filter((t) => t.grossProfit > 0)
      .sort((a, b) => b.grossMargin - a.grossMargin)
      .slice(0, 5);

    // Bottom performing trips
    const bottomTrips = [...tripPnLs]
      .filter((t) => t.grossProfit <= 0)
      .sort((a, b) => a.grossMargin - b.grossMargin)
      .slice(0, 5);

    // Cost breakdown by category
    const costBreakdown: Record<string, number> = {};
    tripPnLs.forEach((trip) => {
      [...trip.fixedCosts, ...trip.variableCosts].forEach((cost) => {
        const category = cost.category;
        costBreakdown[category] = (costBreakdown[category] || 0) + cost.amount;
      });
    });

    logger.info('Finance dashboard data fetched', {
      userId: user.id,
      period,
      tripCount: tripPnLs.length,
    });

    return NextResponse.json({
      summary,
      trips: tripPnLs,
      monthlyTrends,
      topTrips,
      bottomTrips,
      costBreakdown,
      dateRange: {
        from: dateFromStr,
        to: dateToStr,
      },
    });
  } catch (error) {
    logger.error('Finance dashboard error', error, { userId: user.id });
    throw error;
  }
});

