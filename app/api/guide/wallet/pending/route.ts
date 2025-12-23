/**
 * API: Guide Wallet Pending Earnings
 * GET /api/guide/wallet/pending - Get pending earnings (not yet in wallet)
 */

import { NextResponse } from 'next/server';

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
    // Get completed trips that haven't been paid yet
    // (trips with check_out_at but no earning transaction)
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    const walletId = wallet?.id as string | null;

    // Get trip_guides with completed trips (check_out_at exists)
    let completedTripsQuery = client
      .from('trip_guides')
      .select(
        'trip_id, fee_amount, check_out_at, is_late, documentation_uploaded'
      )
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .order('check_out_at', { ascending: false })
      .limit(20);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: trips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);

      const tripIds = trips?.map((t: { id: string }) => t.id) || [];
      if (tripIds.length > 0) {
        completedTripsQuery = completedTripsQuery.in('trip_id', tripIds);
      } else {
        return NextResponse.json({ pending: [], total: 0 });
      }
    }

    const { data: completedTrips } = await completedTripsQuery;

    if (!completedTrips || completedTrips.length === 0) {
      return NextResponse.json({ pending: [], total: 0 });
    }

    const tripIds = completedTrips.map((ct: { trip_id: string }) => ct.trip_id);

    // Get trips info
    const { data: trips } = await client
      .from('trips')
      .select('id, trip_code, trip_date, status')
      .in('id', tripIds);

    const tripMap = new Map<
      string,
      {
        trip_code: string | null;
        trip_date: string | null;
        status: string | null;
      }
    >();
    (trips || []).forEach(
      (t: {
        id: string;
        trip_code: string | null;
        trip_date: string | null;
        status: string | null;
      }) => {
        tripMap.set(t.id, {
          trip_code: t.trip_code,
          trip_date: t.trip_date,
          status: t.status,
        });
      }
    );

    // Get paid transactions (earnings already in wallet)
    const paidTripIds = new Set<string>();
    if (walletId) {
      const { data: paidTransactions } = await client
        .from('guide_wallet_transactions')
        .select('reference_id')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'earning')
        .eq('reference_type', 'trip')
        .in('reference_id', tripIds);

      (paidTransactions || []).forEach((pt: { reference_id: string }) => {
        paidTripIds.add(pt.reference_id);
      });
    }

    // Get penalties for these trips
    let penaltiesQuery = client
      .from('salary_deductions')
      .select('amount, trip_id')
      .eq('guide_id', user.id)
      .in('trip_id', tripIds);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      penaltiesQuery = penaltiesQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: penalties } = await penaltiesQuery;

    const penaltyMap = new Map<string, number>();
    (penalties || []).forEach((p: { amount: number; trip_id: string }) => {
      const current = penaltyMap.get(p.trip_id) || 0;
      penaltyMap.set(p.trip_id, current + Number(p.amount || 0));
    });

    // Get reviews for rating bonus
    const { data: tripBookings } = await client
      .from('trip_bookings')
      .select('booking_id, trip_id')
      .in('trip_id', tripIds);

    const bookingIds =
      tripBookings?.map((tb: { booking_id: string }) => tb.booking_id) || [];

    const { data: reviews } = await client
      .from('reviews')
      .select('guide_rating, booking_id')
      .in('booking_id', bookingIds)
      .not('guide_rating', 'is', null);

    const reviewMap = new Map<string, number>();
    (reviews || []).forEach(
      (r: { guide_rating: number | null; booking_id: string }) => {
        const booking = tripBookings?.find(
          (tb: { booking_id: string }) => tb.booking_id === r.booking_id
        );
        if (booking && r.guide_rating) {
          const current = reviewMap.get(booking.trip_id) || 0;
          reviewMap.set(booking.trip_id, Math.max(current, r.guide_rating));
        }
      }
    );

    // Calculate pending earnings
    const pending: Array<{
      tripId: string;
      tripCode: string;
      tripDate: string;
      amount: number;
      status: string;
    }> = [];

    completedTrips.forEach(
      (ct: {
        trip_id: string;
        fee_amount: number;
        is_late: boolean;
        documentation_uploaded: boolean;
        check_out_at: string;
      }) => {
        if (paidTripIds.has(ct.trip_id)) {
          return; // Already paid
        }

        const trip = tripMap.get(ct.trip_id);
        if (!trip) return;

        const fee = Number(ct.fee_amount || 0);
        let bonus = 0;

        // Rating bonus
        const rating = reviewMap.get(ct.trip_id);
        if (rating === 5) {
          bonus += fee * 0.1;
        } else if (rating === 4) {
          bonus += fee * 0.05;
        }

        // On-time bonus
        if (!ct.is_late) {
          bonus += 50000;
        }

        // Documentation bonus
        if (ct.documentation_uploaded) {
          bonus += 100000;
        }

        const penalty = penaltyMap.get(ct.trip_id) || 0;
        const net = fee + bonus - penalty;

        pending.push({
          tripId: ct.trip_id,
          tripCode: trip.trip_code || 'N/A',
          tripDate: trip.trip_date || '',
          amount: Math.round(net),
          status: trip.status || 'completed',
        });
      }
    );

    const total = pending.reduce(
      (sum: number, p: { amount: number }) => sum + p.amount,
      0
    );

    // Get salary payments that are ready but not paid
    let salaryQuery = client
      .from('salary_payments')
      .select('id, period_start, period_end, net_amount, status')
      .eq('guide_id', user.id)
      .in('status', ['ready', 'documentation_required'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      salaryQuery = salaryQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: salaryPayments } = await salaryQuery;

    const salaryPending = (salaryPayments || []).map(
      (sp: {
        id: string;
        period_start: string;
        period_end: string;
        net_amount: number;
        status: string;
      }) => ({
        id: sp.id,
        period: `${sp.period_start} s/d ${sp.period_end}`,
        amount: Number(sp.net_amount || 0),
        status: sp.status,
        type: 'salary' as const,
      })
    );

    return NextResponse.json({
      pending: pending.slice(0, 10), // Limit to 10 most recent
      salary: salaryPending,
      total:
        total +
        salaryPending.reduce(
          (sum: number, s: { amount: number }) => sum + s.amount,
          0
        ),
    });
  } catch (error) {
    logger.error('Failed to fetch pending earnings', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch pending earnings' },
      { status: 500 }
    );
  }
});
