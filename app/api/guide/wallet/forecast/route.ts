/**
 * API: Guide Wallet Forecast
 * GET /api/guide/wallet/forecast - Forecast next month earnings based on scheduled trips
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get next month date range
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    // Get scheduled trips for next month
    let scheduledTripsQuery = client.from('trip_guides')
      .select('trip_id, fee_amount')
      .eq('guide_id', user.id);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: trips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId)
        .gte('trip_date', nextMonthStart.toISOString().split('T')[0])
        .lte('trip_date', nextMonthEnd.toISOString().split('T')[0])
        .in('status', ['scheduled', 'preparing']);

      const tripIds = trips?.map((t: { id: string }) => t.id) || [];
      if (tripIds.length > 0) {
        scheduledTripsQuery = scheduledTripsQuery.in('trip_id', tripIds);
      } else {
        return NextResponse.json({
          forecast: 0,
          tripCount: 0,
          averagePerTrip: 0,
          basedOn: 'scheduled_trips',
        });
      }
    } else {
      const { data: trips } = await client
        .from('trips')
        .select('id')
        .gte('trip_date', nextMonthStart.toISOString().split('T')[0])
        .lte('trip_date', nextMonthEnd.toISOString().split('T')[0])
        .in('status', ['scheduled', 'preparing']);

      const tripIds = trips?.map((t: { id: string }) => t.id) || [];
      if (tripIds.length > 0) {
        scheduledTripsQuery = scheduledTripsQuery.in('trip_id', tripIds);
      } else {
        return NextResponse.json({
          forecast: 0,
          tripCount: 0,
          averagePerTrip: 0,
          basedOn: 'scheduled_trips',
        });
      }
    }

    const { data: scheduledTrips } = await scheduledTripsQuery;

    if (!scheduledTrips || scheduledTrips.length === 0) {
      // Fallback: Use historical average
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      let historicalTripsQuery = client.from('trip_guides')
        .select('trip_id, fee_amount')
        .eq('guide_id', user.id)
        .gte('check_in_at', lastMonthStart.toISOString())
        .lte('check_in_at', lastMonthEnd.toISOString())
        .not('check_in_at', 'is', null);

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        const { data: trips } = await client
          .from('trips')
          .select('id')
          .eq('branch_id', branchContext.branchId)
          .gte('trip_date', lastMonthStart.toISOString().split('T')[0])
          .lte('trip_date', lastMonthEnd.toISOString().split('T')[0]);

        const tripIds = trips?.map((t: { id: string }) => t.id) || [];
        if (tripIds.length > 0) {
          historicalTripsQuery = historicalTripsQuery.in('trip_id', tripIds);
        } else {
          return NextResponse.json({
            forecast: 0,
            tripCount: 0,
            averagePerTrip: 0,
            basedOn: 'historical_average',
          });
        }
      }

      const { data: historicalTrips } = await historicalTripsQuery;

      if (!historicalTrips || historicalTrips.length === 0) {
        return NextResponse.json({
          forecast: 0,
          tripCount: 0,
          averagePerTrip: 0,
          basedOn: 'no_data',
        });
      }

      const avgFee = historicalTrips.reduce(
        (sum: number, t: { fee_amount: number }) => sum + (Number(t.fee_amount) || 0),
        0,
      ) / historicalTrips.length;

      // Estimate 8 trips for next month (average)
      const estimatedTrips = 8;
      const forecast = Math.round(avgFee * estimatedTrips * 1.15); // +15% for bonuses

      return NextResponse.json({
        forecast,
        tripCount: estimatedTrips,
        averagePerTrip: Math.round(avgFee),
        basedOn: 'historical_average',
      });
    }

    // Calculate forecast based on scheduled trips
    const totalFee = scheduledTrips.reduce(
      (sum: number, t: { fee_amount: number }) => sum + (Number(t.fee_amount) || 0),
      0,
    );

    // Add estimated bonuses (15% average)
    const forecast = Math.round(totalFee * 1.15);
    const averagePerTrip = scheduledTrips.length > 0 ? Math.round(totalFee / scheduledTrips.length) : 0;

    return NextResponse.json({
      forecast,
      tripCount: scheduledTrips.length,
      averagePerTrip,
      basedOn: 'scheduled_trips',
    });
  } catch (error) {
    logger.error('Failed to fetch forecast', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 500 });
  }
});

