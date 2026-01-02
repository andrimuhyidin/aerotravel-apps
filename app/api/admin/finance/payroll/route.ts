/**
 * API: Payroll Management
 * GET /api/admin/finance/payroll
 * Returns guide payroll data based on trip assignments
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export type GuidePayrollItem = {
  guideId: string;
  guideName: string;
  tripCount: number;
  totalPax: number;
  baseFee: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  trips: Array<{
    tripId: string;
    tripCode: string;
    packageName: string;
    startDate: string;
    paxCount: number;
    fee: number;
    bonus: number;
  }>;
};

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
  const period = searchParams.get('period') || 'month'; // week, month
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
        case 'week':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 7);
          break;
        case 'month':
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    // Fetch trip guides with guide assignments
    const { data: tripGuides, error: tripGuidesError } = await supabase
      .from('trip_guides')
      .select(`
        id,
        guide_id,
        trip_id,
        guide_role,
        fee_amount,
        trips(
          id,
          trip_code,
          trip_date,
          status,
          packages(id, name)
        ),
        users(id, full_name, email)
      `)
      .gte('trips.trip_date', dateFromStr)
      .lte('trips.trip_date', dateToStr)
      .in('trips.status', ['confirmed', 'completed', 'in_progress']);

    if (tripGuidesError) {
      logger.error('Failed to fetch trip guides for payroll', tripGuidesError);
      throw tripGuidesError;
    }

    // Get booking counts per trip for pax calculation via trip_bookings
    const tripIds = [...new Set((tripGuides || []).map((tg) => tg.trip_id))];
    let tripPaxCounts: Record<string, number> = {};

    if (tripIds.length > 0) {
      const { data: tripBookingsData, error: tripBookingsError } = await supabase
        .from('trip_bookings')
        .select(`
          trip_id,
          bookings(adult_pax, child_pax, status)
        `)
        .in('trip_id', tripIds);

      if (!tripBookingsError && tripBookingsData) {
        tripPaxCounts = tripBookingsData.reduce((acc, tb) => {
          const tripId = tb.trip_id as string;
          const booking = tb.bookings as { adult_pax?: number; child_pax?: number; status?: string } | null;
          if (booking && ['confirmed', 'paid', 'completed'].includes(booking.status || '')) {
            const paxCount = (booking.adult_pax || 0) + (booking.child_pax || 0);
            acc[tripId] = (acc[tripId] || 0) + paxCount;
          }
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Aggregate by guide
    const guideMap = new Map<string, GuidePayrollItem>();

    (tripGuides || []).forEach((tg) => {
      const guide = tg.users as { id: string; full_name: string; email: string } | null;
      const trip = tg.trips as {
        id: string;
        trip_code: string;
        trip_date: string;
        status: string;
        packages: { id: string; name: string } | null;
      } | null;

      if (!guide || !trip) return;

      const guideId = guide.id;
      const existing = guideMap.get(guideId);
      const paxCount = tripPaxCounts[trip.id] || 0;
      const fee = Number(tg.fee_amount) || 200000; // Default fee
      const bonus = 0; // Bonus calculated separately if needed

      const tripItem = {
        tripId: trip.id,
        tripCode: trip.trip_code || '',
        packageName: trip.packages?.name || 'Unknown Package',
        startDate: trip.trip_date,
        paxCount,
        fee,
        bonus,
      };

      if (existing) {
        existing.tripCount += 1;
        existing.totalPax += paxCount;
        existing.baseFee += fee;
        existing.bonuses += bonus;
        existing.netPay = existing.baseFee + existing.bonuses - existing.deductions;
        existing.trips.push(tripItem);
      } else {
        guideMap.set(guideId, {
          guideId,
          guideName: guide.full_name || guide.email || 'Unknown Guide',
          tripCount: 1,
          totalPax: paxCount,
          baseFee: fee,
          bonuses: bonus,
          deductions: 0,
          netPay: fee + bonus,
          trips: [tripItem],
        });
      }
    });

    const payrollItems = Array.from(guideMap.values()).sort((a, b) => b.netPay - a.netPay);

    // Calculate summary
    const summary = {
      totalGuides: payrollItems.length,
      totalTrips: payrollItems.reduce((sum, g) => sum + g.tripCount, 0),
      totalPax: payrollItems.reduce((sum, g) => sum + g.totalPax, 0),
      totalPayroll: payrollItems.reduce((sum, g) => sum + g.netPay, 0),
      totalBaseFee: payrollItems.reduce((sum, g) => sum + g.baseFee, 0),
      totalBonuses: payrollItems.reduce((sum, g) => sum + g.bonuses, 0),
      totalDeductions: payrollItems.reduce((sum, g) => sum + g.deductions, 0),
    };

    logger.info('Payroll data fetched', {
      userId: user.id,
      period,
      guideCount: payrollItems.length,
    });

    return NextResponse.json({
      payroll: payrollItems,
      summary,
      dateRange: {
        from: dateFromStr,
        to: dateToStr,
      },
    });
  } catch (error) {
    logger.error('Payroll fetch error', error, { userId: user.id });
    throw error;
  }
});

