/**
 * API: Guide Wallet Analytics
 * GET /api/guide/wallet/analytics - Earnings breakdown, trends, and analytics
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { awardPoints, calculatePerformanceBonusPoints } from '@/lib/guide/reward-points';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly
  const months = parseInt(searchParams.get('months') || '6', 10);

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get wallet
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!wallet) {
      return NextResponse.json({
        today: { amount: 0, growth: 0 },
        thisWeek: { amount: 0, growth: 0 },
        thisMonth: { amount: 0, growth: 0 },
        breakdown: { baseFee: 0, bonus: 0, deductions: 0 },
        trends: [],
        tripBreakdown: [],
      });
    }

    const walletId = wallet.id as string;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get today earnings - filter by check_out_at from trip_guides for date consistency
    // First, get trip IDs with check_out_at in today's range
    let todayTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', todayStart.toISOString())
      .lt('check_out_at', todayEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        todayTripsQuery = todayTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: todayTrips } = await todayTripsQuery;
    const todayTripIds = todayTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: todayEarnings } =
      todayTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', todayTripIds)
        : { data: [] };

    const todayAmount = (todayEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    // Get yesterday for comparison
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    // Get yesterday earnings - filter by check_out_at
    let yesterdayTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', yesterdayStart.toISOString())
      .lt('check_out_at', yesterdayEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        yesterdayTripsQuery = yesterdayTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: yesterdayTrips } = await yesterdayTripsQuery;
    const yesterdayTripIds = yesterdayTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: yesterdayEarnings } =
      yesterdayTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', yesterdayTripIds)
        : { data: [] };

    const yesterdayAmount = (yesterdayEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    const todayGrowth = yesterdayAmount > 0 ? ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100 : 0;

    // Get this week earnings - filter by check_out_at
    let weekTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', weekStart.toISOString())
      .lt('check_out_at', weekEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        weekTripsQuery = weekTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: weekTrips } = await weekTripsQuery;
    const weekTripIds = weekTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: weekEarnings } =
      weekTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', weekTripIds)
        : { data: [] };

    const weekAmount = (weekEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    // Get last week for comparison
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);

    // Get last week earnings - filter by check_out_at
    let lastWeekTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', lastWeekStart.toISOString())
      .lt('check_out_at', lastWeekEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        lastWeekTripsQuery = lastWeekTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: lastWeekTrips } = await lastWeekTripsQuery;
    const lastWeekTripIds = lastWeekTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: lastWeekEarnings } =
      lastWeekTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', lastWeekTripIds)
        : { data: [] };

    const lastWeekAmount = (lastWeekEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    const weekGrowth = lastWeekAmount > 0 ? ((weekAmount - lastWeekAmount) / lastWeekAmount) * 100 : 0;

    // Get this month earnings - filter by check_out_at for date consistency
    let monthTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', monthStart.toISOString())
      .lte('check_out_at', monthEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        monthTripsQuery = monthTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: monthTrips } = await monthTripsQuery;
    const monthTripIds = monthTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: monthEarnings } =
      monthTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', monthTripIds)
        : { data: [] };

    const monthAmount = (monthEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    // Get last month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get last month earnings - filter by check_out_at
    let lastMonthTripsQuery = client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_out_at', 'is', null)
      .gte('check_out_at', lastMonthStart.toISOString())
      .lte('check_out_at', lastMonthEnd.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: branchTrips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId);
      const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
      if (branchTripIds.length > 0) {
        lastMonthTripsQuery = lastMonthTripsQuery.in('trip_id', branchTripIds);
      }
    }

    const { data: lastMonthTrips } = await lastMonthTripsQuery;
    const lastMonthTripIds = lastMonthTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

    const { data: lastMonthEarnings } =
      lastMonthTripIds.length > 0
        ? await client
            .from('guide_wallet_transactions')
            .select('amount')
            .eq('wallet_id', walletId)
            .eq('transaction_type', 'earning')
            .eq('reference_type', 'trip')
            .in('reference_id', lastMonthTripIds)
        : { data: [] };

    const lastMonthAmount = (lastMonthEarnings ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
      0,
    );

    const monthGrowth = lastMonthAmount > 0 ? ((monthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

    // Get breakdown (base fee, bonus, deductions) from trip_guides
    // Use check_out_at instead of check_in_at for consistency with earnings calculation
    let tripGuidesQuery = client.from('trip_guides')
      .select('trip_id, fee_amount, is_late, documentation_uploaded')
      .eq('guide_id', user.id)
      .gte('check_out_at', monthStart.toISOString())
      .lte('check_out_at', monthEnd.toISOString())
      .not('check_out_at', 'is', null);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      // Filter through trips table
      const { data: trips } = await client
        .from('trips')
        .select('id')
        .eq('branch_id', branchContext.branchId)
        .gte('trip_date', monthStart.toISOString().split('T')[0])
        .lte('trip_date', monthEnd.toISOString().split('T')[0]);

      const tripIds = trips?.map((t: { id: string }) => t.id) || [];
      if (tripIds.length > 0) {
        tripGuidesQuery = tripGuidesQuery.in('trip_id', tripIds);
      } else {
        return NextResponse.json({
          today: { amount: todayAmount, growth: todayGrowth },
          thisWeek: { amount: weekAmount, growth: weekGrowth },
          thisMonth: { amount: monthAmount, growth: monthGrowth },
          breakdown: { baseFee: 0, bonus: 0, deductions: 0 },
          trends: [],
          tripBreakdown: [],
        });
      }
    }

    const { data: tripGuides } = await tripGuidesQuery;

    let baseFee = 0;
    let bonus = 0;
    let deductions = 0;

    // Initialize maps outside scope
    const penaltyMap = new Map<string, number>();
    const reviewMap = new Map<string, number>();

    if (tripGuides && tripGuides.length > 0) {
      const tripIds = tripGuides.map((tg: { trip_id: string }) => tg.trip_id);

      // Get penalties
      let penaltiesQuery = client.from('salary_deductions')
        .select('amount, trip_id')
        .eq('guide_id', user.id)
        .in('trip_id', tripIds)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        penaltiesQuery = penaltiesQuery.eq('branch_id', branchContext.branchId);
      }

      const { data: penalties } = await penaltiesQuery;

      // Get reviews for rating bonus
      const { data: tripBookings } = await client
        .from('trip_bookings')
        .select('booking_id, trip_id')
        .in('trip_id', tripIds);

      const bookingIds = tripBookings?.map((tb: { booking_id: string }) => tb.booking_id) || [];

      const { data: reviews } = await client
        .from('reviews')
        .select('guide_rating, booking_id')
        .in('booking_id', bookingIds)
        .not('guide_rating', 'is', null);

      // Calculate breakdown
      (penalties || []).forEach((p: { amount: number; trip_id: string }) => {
        const current = penaltyMap.get(p.trip_id) || 0;
        penaltyMap.set(p.trip_id, current + Number(p.amount || 0));
      });

      (reviews || []).forEach((r: { guide_rating: number | null; booking_id: string }) => {
        const booking = tripBookings?.find((tb: { booking_id: string }) => tb.booking_id === r.booking_id);
        if (booking && r.guide_rating) {
          const current = reviewMap.get(booking.trip_id) || 0;
          reviewMap.set(booking.trip_id, Math.max(current, r.guide_rating));
        }
      });

      tripGuides.forEach((tg: { trip_id: string; fee_amount: number; is_late: boolean; documentation_uploaded: boolean }) => {
        const fee = Number(tg.fee_amount || 0);
        baseFee += fee;

        // Rating bonus (5⭐ = +10%, 4⭐ = +5%)
        const rating = reviewMap.get(tg.trip_id);
        if (rating === 5) {
          bonus += fee * 0.1;
        } else if (rating === 4) {
          bonus += fee * 0.05;
        }

        // On-time bonus (+Rp 50,000)
        if (!tg.is_late) {
          bonus += 50000;
        }

        // Documentation bonus (+Rp 100,000)
        if (tg.documentation_uploaded) {
          bonus += 100000;
        }

        // Penalties
        const penalty = penaltyMap.get(tg.trip_id) || 0;
        deductions += penalty;
      });

      // Award reward points for performance bonuses (10% of bonus amount)
      // This is calculated per trip, but we'll award points for the total bonus
      if (bonus > 0) {
        const pointsToAward = calculatePerformanceBonusPoints(bonus);
        // Award points asynchronously (don't await to avoid blocking)
        awardPoints(
          user.id,
          pointsToAward,
          'performance',
          undefined,
          `Performance bonus points for ${months} month(s)`,
          { period: `${months} months`, bonusAmount: bonus }
        ).catch((error) => {
          logger.error('Failed to award performance bonus points', error, {
            guideId: user.id,
            bonusAmount: bonus,
            points: pointsToAward,
          });
        });
      }
    }

    // Get trends (last N months)
    const trends: Array<{ month: string; amount: number }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trendStart = new Date(trendDate.getFullYear(), trendDate.getMonth(), 1);
      const trendEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0, 23, 59, 59);

      // Get trend earnings - filter by check_out_at
      let trendTripsQuery = client
        .from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id)
        .not('check_out_at', 'is', null)
        .gte('check_out_at', trendStart.toISOString())
        .lte('check_out_at', trendEnd.toISOString());

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        const { data: branchTrips } = await client
          .from('trips')
          .select('id')
          .eq('branch_id', branchContext.branchId);
        const branchTripIds = branchTrips?.map((t: { id: string }) => t.id) || [];
        if (branchTripIds.length > 0) {
          trendTripsQuery = trendTripsQuery.in('trip_id', branchTripIds);
        }
      }

      const { data: trendTrips } = await trendTripsQuery;
      const trendTripIds = trendTrips?.map((t: { trip_id: string }) => t.trip_id) || [];

      const { data: trendEarnings } =
        trendTripIds.length > 0
          ? await client
              .from('guide_wallet_transactions')
              .select('amount')
              .eq('wallet_id', walletId)
              .eq('transaction_type', 'earning')
              .eq('reference_type', 'trip')
              .in('reference_id', trendTripIds)
          : { data: [] };

      const trendAmount = (trendEarnings ?? []).reduce(
        (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
        0,
      );

      trends.push({
        month: trendDate.toISOString().slice(0, 7), // YYYY-MM
        amount: trendAmount,
      });
    }

    // Get trip breakdown (last 10 trips)
    const tripBreakdown: Array<{
      tripId: string;
      tripCode: string;
      tripDate: string;
      baseFee: number;
      bonus: number;
      penalty: number;
      net: number;
    }> = [];

    if (tripGuides && tripGuides.length > 0) {
      const recentTripIds = tripGuides
        .slice(-10)
        .map((tg: { trip_id: string }) => tg.trip_id);

      const { data: trips } = await client
        .from('trips')
        .select('id, trip_code, trip_date')
        .in('id', recentTripIds);

      const tripMap = new Map<string, { trip_code: string | null; trip_date: string | null }>();
      (trips || []).forEach((t: { id: string; trip_code: string | null; trip_date: string | null }) => {
        tripMap.set(t.id, { trip_code: t.trip_code, trip_date: t.trip_date });
      });

      recentTripIds.forEach((tripId: string) => {
        const tg = tripGuides.find((t: { trip_id: string }) => t.trip_id === tripId);
        if (!tg) return;

        const trip = tripMap.get(tripId);
        const fee = Number(tg.fee_amount || 0);
        let tripBonus = 0;
        const rating = reviewMap.get(tripId);
        if (rating === 5) {
          tripBonus += fee * 0.1;
        } else if (rating === 4) {
          tripBonus += fee * 0.05;
        }
        if (!tg.is_late) {
          tripBonus += 50000;
        }
        if (tg.documentation_uploaded) {
          tripBonus += 100000;
        }
        const tripPenalty = penaltyMap.get(tripId) || 0;
        const net = fee + tripBonus - tripPenalty;

        tripBreakdown.push({
          tripId,
          tripCode: trip?.trip_code || 'N/A',
          tripDate: trip?.trip_date || '',
          baseFee: fee,
          bonus: tripBonus,
          penalty: tripPenalty,
          net,
        });
      });
    }

    return NextResponse.json({
      today: { amount: todayAmount, growth: Math.round(todayGrowth * 100) / 100 },
      thisWeek: { amount: weekAmount, growth: Math.round(weekGrowth * 100) / 100 },
      thisMonth: { amount: monthAmount, growth: Math.round(monthGrowth * 100) / 100 },
      breakdown: {
        baseFee: Math.round(baseFee),
        bonus: Math.round(bonus),
        deductions: Math.round(deductions),
      },
      trends,
      tripBreakdown: tripBreakdown.reverse(), // Most recent first
    });
  } catch (error) {
    logger.error('Failed to fetch wallet analytics', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
});

