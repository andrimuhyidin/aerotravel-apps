/**
 * API: Shadow P&L Detail
 * GET /api/admin/finance/shadow-pnl/[tripId]
 * Returns detailed P&L for a single trip
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import {
    calculateBreakevenPax,
    DEFAULT_COST_STRUCTURE,
    generateTripPnL,
    type CostItem,
} from '@/lib/finance/shadow-pnl';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ tripId: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch trip with package
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        trip_code,
        trip_date,
        status,
        package_id,
        packages(id, name, trip_type, destination)
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Fetch bookings via trip_bookings junction table with customer info
    const { data: tripBookingsData, error: tripBookingsError } = await supabase
      .from('trip_bookings')
      .select(`
        trip_id,
        bookings(
          id,
          booking_code,
          adult_pax,
          child_pax,
          total_amount,
          discount_amount,
          status,
          customer_name,
          customer_email,
          customer_phone
        )
      `)
      .eq('trip_id', tripId);

    if (tripBookingsError) {
      logger.error('Failed to fetch bookings for trip P&L', tripBookingsError);
      throw tripBookingsError;
    }

    // Flatten bookings
    const bookings = (tripBookingsData || [])
      .filter((tb) => tb.bookings)
      .map((tb) => {
        const b = tb.bookings as {
          id: string;
          booking_code: string;
          adult_pax?: number;
          child_pax?: number;
          total_amount?: number;
          discount_amount?: number;
          status: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
        };
        return {
          ...b,
          trip_id: tb.trip_id,
          pax_count: (b.adult_pax || 0) + (b.child_pax || 0),
          total_price: b.total_amount || 0,
        };
      });

    // Get cost structure
    const pkg = trip.packages as { id: string; name: string; trip_type?: string; destination?: string } | null;
    const tripType = pkg?.trip_type || 'boat_trip';
    const defaultCosts = DEFAULT_COST_STRUCTURE[tripType] ?? DEFAULT_COST_STRUCTURE['boat_trip'] ?? [];

    // Fetch custom costs from trip_costs table if exists
    let costs: CostItem[] = defaultCosts;
    
    const { data: customCosts, error: costsError } = await supabase
      .from('trip_costs')
      .select('id, name, category, amount, cost_type, notes')
      .eq('trip_id', tripId);

    if (!costsError && customCosts && customCosts.length > 0) {
      // Use custom costs if available
      costs = customCosts.map((cost) => ({
        id: cost.id,
        name: cost.name,
        category: cost.category || 'other',
        amount: cost.amount || 0,
        type: (cost.cost_type as 'fixed' | 'variable') || 'fixed',
        notes: cost.notes,
      }));
      logger.debug('Using custom costs for trip', { tripId, costCount: costs.length });
    } else {
      // Use default cost structure
      logger.debug('Using default costs for trip', { tripId, tripType });
    }

    // Map trip structure to match generateTripPnL expectations
    const tripData = {
      ...trip,
      start_date: trip.trip_date,
      end_date: trip.trip_date,
    };

    // Generate P&L
    const pnl = generateTripPnL(tripData, bookings || [], costs, pkg?.name || 'Unknown Package');

    // Add customer names to revenue items
    const bookingMap = new Map((bookings || []).map((b) => [b.id, b]));
    pnl.revenueItems = pnl.revenueItems.map((item) => {
      const booking = bookingMap.get(item.bookingId);
      return {
        ...item,
        customerName: booking?.customer_name || 'Unknown Customer',
      };
    });

    // Calculate breakeven scenarios
    const variableCostPerPax = pnl.variableCosts.reduce((sum, c) => sum + c.amount, 0);
    const avgPricePerPax = pnl.totalPax > 0 ? pnl.netRevenue / pnl.totalPax : 0;

    const scenarios = {
      current: {
        pax: pnl.totalPax,
        revenue: pnl.netRevenue,
        cost: pnl.totalCost,
        profit: pnl.grossProfit,
        margin: pnl.grossMargin,
      },
      breakeven: {
        pax: pnl.breakevenPax,
        revenue: pnl.breakevenPax * avgPricePerPax,
        cost: pnl.totalFixedCost + (pnl.breakevenPax * variableCostPerPax),
        profit: 0,
        margin: 0,
      },
      target30: calculateBreakevenPax(pnl.totalFixedCost / 0.7, avgPricePerPax, variableCostPerPax),
    };

    logger.info('Shadow P&L detail fetched', {
      userId: user.id,
      tripId,
      tripCode: pnl.tripCode,
    });

    return NextResponse.json({
      trip: {
        id: trip.id,
        tripCode: trip.trip_code,
        startDate: trip.trip_date,
        endDate: trip.trip_date,
        status: trip.status,
        packageName: pkg?.name,
        destination: pkg?.destination,
        tripType,
      },
      pnl,
      scenarios,
      defaultCosts: DEFAULT_COST_STRUCTURE,
    });
  } catch (error) {
    logger.error('Shadow P&L detail error', error, { userId: user.id, tripId });
    throw error;
  }
});

