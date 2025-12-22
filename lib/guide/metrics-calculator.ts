/**
 * Centralized Metrics Calculator
 * Single source of truth for all guide performance metrics calculation
 * Consolidates logic from multiple redundant endpoints
 */

import 'server-only';

import {
  getBranchContext,
  withBranchFilter,
} from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type {
  MetricsCalculationOptions,
  UnifiedMetrics,
} from '@/types/guide-metrics';

export type PeriodConfig = {
  start: Date;
  end: Date;
  type: 'monthly' | 'weekly' | 'custom';
};

/**
 * Calculate unified metrics for a guide
 */
export async function calculateUnifiedMetrics(
  guideId: string,
  period: PeriodConfig,
  options: MetricsCalculationOptions = {}
): Promise<UnifiedMetrics> {
  try {
    const supabase = await createClient();
    const branchContext = await getBranchContext(guideId);
    const client = supabase as unknown as any;

    const include = options.include || [
      'trips',
      'earnings',
      'ratings',
      'performance',
      'development',
      'trends',
    ];
    const calculateTrends = options.calculateTrends ?? true;
    const compareWithPrevious = options.compareWithPrevious ?? false;

    // Check if metrics already calculated in guide_performance_metrics table
    // Note: This table might not exist, so we'll skip if it fails
    try {
      const { data: existingMetrics, error: existingError } = await (
        supabase as any
      )
        .from('guide_performance_metrics')
        .select('*')
        .eq('guide_id', guideId)
        .eq('period_type', period.type)
        .eq('period_start', period.start.toISOString().split('T')[0])
        .eq('period_end', period.end.toISOString().split('T')[0])
        .maybeSingle();

      // If exists and all requested metrics are available, use it
      if (existingMetrics && !existingError && !calculateTrends) {
        return mapExistingMetricsToUnified(existingMetrics, period);
      }
    } catch (tableError) {
      // Table might not exist, continue with calculation
      logger.debug(
        'guide_performance_metrics table not available, calculating from scratch',
        { guideId }
      );
    }

    // Calculate metrics from scratch
    const metrics: UnifiedMetrics = {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        type: period.type,
      },
      trips: {
        total: 0,
        completed: 0,
        cancelled: 0,
      },
      earnings: {
        total: 0,
        average: 0,
        byTrip: 0,
      },
      ratings: {
        average: null,
        total: 0,
        trend: [],
      },
      performance: {
        score: null,
        tier: null,
        onTimeRate: null,
        percentile: 50,
      },
      development: {
        skillsImproved: 0,
        assessmentsCompleted: 0,
      },
      customerSatisfaction: undefined,
      efficiency: undefined,
      financial: undefined,
      quality: undefined,
      growth: undefined,
      comparative: undefined,
    };

    // Calculate trips metrics
    if (include.includes('trips')) {
      const tripsData = await calculateTripsMetrics(
        guideId,
        period,
        branchContext,
        client
      );
      metrics.trips = tripsData;
    }

    // Calculate earnings metrics
    if (include.includes('earnings')) {
      const earningsData = await calculateEarningsMetrics(
        guideId,
        period,
        branchContext,
        client
      );
      metrics.earnings = earningsData;
    }

    // Calculate ratings metrics
    if (include.includes('ratings')) {
      const ratingsData = await calculateRatingsMetrics(
        guideId,
        period,
        branchContext,
        client,
        calculateTrends
      );
      metrics.ratings = ratingsData;
    }

    // Calculate performance metrics
    if (include.includes('performance')) {
      const performanceData = await calculatePerformanceMetrics(
        guideId,
        period,
        branchContext,
        client,
        metrics.trips,
        metrics.ratings,
        metrics.earnings
      );
      metrics.performance = performanceData;
    }

    // Calculate development metrics
    if (include.includes('development')) {
      const developmentData = await calculateDevelopmentMetrics(
        guideId,
        period,
        branchContext,
        client
      );
      metrics.development = developmentData;
    }

    // Calculate customer satisfaction metrics
    if (include.includes('customerSatisfaction')) {
      const customerSatisfactionData =
        await calculateCustomerSatisfactionMetrics(
          guideId,
          period,
          branchContext,
          client
        );
      metrics.customerSatisfaction = customerSatisfactionData;
    }

    // Calculate efficiency metrics
    if (include.includes('efficiency')) {
      const efficiencyData = await calculateEfficiencyMetrics(
        guideId,
        period,
        branchContext,
        client,
        metrics.trips,
        metrics.earnings
      );
      metrics.efficiency = efficiencyData;
    }

    // Calculate financial metrics
    if (include.includes('financial')) {
      const financialData = await calculateFinancialMetrics(
        guideId,
        period,
        branchContext,
        client,
        metrics.earnings
      );
      metrics.financial = financialData;
    }

    // Calculate quality metrics
    if (include.includes('quality')) {
      const qualityData = await calculateQualityMetrics(
        guideId,
        period,
        branchContext,
        client
      );
      metrics.quality = qualityData;
    }

    // Calculate growth metrics
    if (include.includes('growth') && compareWithPrevious) {
      const previousPeriod = getPreviousPeriod(period);
      const previousMetrics = await calculateUnifiedMetrics(
        guideId,
        previousPeriod,
        {
          include: ['trips', 'earnings', 'ratings', 'development'],
          calculateTrends: false,
          compareWithPrevious: false,
        }
      );
      const growthData = await calculateGrowthMetrics(
        guideId,
        period,
        branchContext,
        client,
        metrics,
        previousMetrics
      );
      metrics.growth = growthData;
    }

    // Calculate comparative metrics
    if (include.includes('comparative')) {
      const comparativeData = await calculateComparativeMetrics(
        guideId,
        period,
        branchContext,
        client,
        metrics
      );
      metrics.comparative = comparativeData;
    }

    // Calculate trends if requested
    if (
      include.includes('trends') &&
      calculateTrends &&
      compareWithPrevious &&
      include.length > 0
    ) {
      const previousPeriod = getPreviousPeriod(period);
      const previousMetrics = await calculateUnifiedMetrics(
        guideId,
        previousPeriod,
        {
          include: ['trips', 'earnings', 'ratings'],
          calculateTrends: false,
          compareWithPrevious: false,
        }
      );

      // Calculate trends
      if (previousMetrics.trips.total > 0) {
        const tripsChange =
          ((metrics.trips.total - previousMetrics.trips.total) /
            previousMetrics.trips.total) *
          100;
        metrics.trips.trend = {
          value: Math.abs(tripsChange),
          direction:
            tripsChange > 0 ? 'up' : tripsChange < 0 ? 'down' : 'stable',
        };
      }

      if (previousMetrics.earnings.total > 0) {
        const earningsChange =
          ((metrics.earnings.total - previousMetrics.earnings.total) /
            previousMetrics.earnings.total) *
          100;
        metrics.earnings.trend = {
          value: Math.abs(earningsChange),
          direction:
            earningsChange > 0 ? 'up' : earningsChange < 0 ? 'down' : 'stable',
        };
      }
    }

    return metrics;
  } catch (error) {
    logger.error('Failed to calculate unified metrics', error, {
      guideId,
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        type: period.type,
      },
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    // Return default metrics instead of throwing to prevent complete failure
    return {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        type: period.type,
      },
      trips: {
        total: 0,
        completed: 0,
        cancelled: 0,
      },
      earnings: {
        total: 0,
        average: 0,
        byTrip: 0,
      },
      ratings: {
        average: null,
        total: 0,
        trend: [],
      },
      performance: {
        score: null,
        tier: null,
        onTimeRate: null,
        percentile: 50,
      },
      development: {
        skillsImproved: 0,
        assessmentsCompleted: 0,
      },
      customerSatisfaction: undefined,
      efficiency: undefined,
      financial: undefined,
      quality: undefined,
      growth: undefined,
      comparative: undefined,
    };
  }
}

/**
 * Calculate trips metrics
 */
async function calculateTripsMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any
) {
  try {
    const { data: tripGuides, error } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('trip:trips(status)')
      .eq('guide_id', guideId)
      .gte('check_out_at', period.start.toISOString())
      .lte('check_out_at', period.end.toISOString())
      .not('check_out_at', 'is', null);

    if (error) {
      logger.warn('Error fetching trips metrics', error, { guideId });
      return {
        total: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    const total = tripGuides?.length || 0;
    const completed =
      tripGuides?.filter(
        (tg: { trip?: { status?: string } }) => tg.trip?.status === 'completed'
      ).length || 0;
    const cancelled =
      tripGuides?.filter(
        (tg: { trip?: { status?: string } }) => tg.trip?.status === 'cancelled'
      ).length || 0;

    return {
      total,
      completed,
      cancelled,
    };
  } catch (error) {
    logger.error('Failed to calculate trips metrics', error, { guideId });
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
    };
  }
}

/**
 * Calculate earnings metrics
 */
async function calculateEarningsMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any
) {
  try {
    // Get wallet
    const { data: wallet, error: walletError } = await withBranchFilter(
      client.from('guide_wallets'),
      branchContext
    )
      .select('id')
      .eq('guide_id', guideId)
      .maybeSingle();

    if (walletError || !wallet) {
      logger.debug('No wallet found for guide', { guideId });
      return {
        total: 0,
        average: 0,
        byTrip: 0,
      };
    }

    // Get trip IDs for this period
    const { data: tripGuides } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('trip_id')
      .eq('guide_id', guideId)
      .gte('check_out_at', period.start.toISOString())
      .lte('check_out_at', period.end.toISOString())
      .not('check_out_at', 'is', null);

    const tripIds =
      tripGuides?.map((tg: { trip_id: string }) => tg.trip_id) || [];

    // Get earnings transactions
    let totalEarnings = 0;
    let earningsByTrip = 0;

    if (tripIds.length > 0) {
      const { data: transactions } = await client
        .from('guide_wallet_transactions')
        .select('amount, transaction_type, reference_id')
        .eq('wallet_id', (wallet as { id: string }).id)
        .eq('transaction_type', 'earning')
        .eq('reference_type', 'trip')
        .in('reference_id', tripIds);

      if (transactions) {
        totalEarnings = transactions.reduce(
          (sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0),
          0
        );
        earningsByTrip = transactions.length;
      }
    }

    // Calculate average from trip_guides fee_amount for completed trips
    const { data: completedTrips } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('fee_amount, trip:trips(status)')
      .eq('guide_id', guideId)
      .gte('check_out_at', period.start.toISOString())
      .lte('check_out_at', period.end.toISOString())
      .not('check_out_at', 'is', null);

    const completedCount =
      completedTrips?.filter(
        (tg: { trip?: { status?: string } }) => tg.trip?.status === 'completed'
      ).length || 0;

    const average = completedCount > 0 ? totalEarnings / completedCount : 0;

    return {
      total: totalEarnings,
      average,
      byTrip: earningsByTrip,
    };
  } catch (error) {
    logger.error('Failed to calculate earnings metrics', error, { guideId });
    return {
      total: 0,
      average: 0,
      byTrip: 0,
    };
  }
}

/**
 * Calculate ratings metrics
 */
async function calculateRatingsMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  includeTrend: boolean
) {
  // Get trip IDs for this period
  const { data: tripGuides } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext
  )
    .select('trip_id')
    .eq('guide_id', guideId)
    .gte('check_out_at', period.start.toISOString())
    .lte('check_out_at', period.end.toISOString())
    .not('check_out_at', 'is', null);

  const tripIds =
    tripGuides?.map((tg: { trip_id: string }) => tg.trip_id) || [];

  if (tripIds.length === 0) {
    return {
      average: null,
      total: 0,
      trend: [],
    };
  }

  // Get bookings for these trips
  const { data: tripBookings } = await withBranchFilter(
    client.from('trip_bookings'),
    branchContext
  )
    .select('booking_id')
    .in('trip_id', tripIds);

  const bookingIds =
    tripBookings?.map((tb: { booking_id: string }) => tb.booking_id) || [];

  if (bookingIds.length === 0) {
    return {
      average: null,
      total: 0,
      trend: [],
    };
  }

  // Get reviews
  const { data: reviews } = await client
    .from('reviews')
    .select('guide_rating, created_at')
    .in('booking_id', bookingIds)
    .not('guide_rating', 'is', null)
    .order('created_at', { ascending: true });

  const ratings = (reviews || [])
    .map((r: { guide_rating: number | null }) => r.guide_rating)
    .filter((r: number | null): r is number => r !== null && r > 0);

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

  // Calculate rating distribution
  const distribution = {
    '1': ratings.filter((r) => r === 1).length,
    '2': ratings.filter((r) => r === 2).length,
    '3': ratings.filter((r) => r === 3).length,
    '4': ratings.filter((r) => r === 4).length,
    '5': ratings.filter((r) => r === 5).length,
  };

  // Get rating trend (last 5 trips)
  let ratingTrend: number[] = [];
  if (includeTrend && tripIds.length > 0) {
    const last5TripIds = tripIds.slice(-5);
    const { data: last5Bookings } = await withBranchFilter(
      client.from('trip_bookings'),
      branchContext
    )
      .select('booking_id')
      .in('trip_id', last5TripIds);

    const last5BookingIds =
      last5Bookings?.map((tb: { booking_id: string }) => tb.booking_id) || [];

    if (last5BookingIds.length > 0) {
      const { data: last5Reviews } = await client
        .from('reviews')
        .select('guide_rating, created_at')
        .in('booking_id', last5BookingIds)
        .not('guide_rating', 'is', null)
        .order('created_at', { ascending: true });

      if (last5Reviews) {
        ratingTrend = last5Reviews
          .map((r: { guide_rating: number | null }) => r.guide_rating)
          .filter((r: number | null): r is number => r !== null && r > 0);
      }
    }
  }

  return {
    average,
    total: ratings.length,
    trend: ratingTrend,
    distribution,
  };
}

/**
 * Calculate performance metrics
 */
async function calculatePerformanceMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  trips: { total: number; completed: number; cancelled: number },
  ratings: { average: number | null; total: number },
  earnings: { total: number; average: number }
) {
  // Calculate on-time rate
  const { data: tripGuides } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext
  )
    .select('is_late')
    .eq('guide_id', guideId)
    .gte('check_in_at', period.start.toISOString())
    .lte('check_in_at', period.end.toISOString())
    .not('check_in_at', 'is', null)
    .not('check_out_at', 'is', null);

  const totalTrips = tripGuides?.length || 0;
  const onTimeTrips =
    tripGuides?.filter((tg: { is_late: boolean }) => !tg.is_late).length || 0;
  const onTimeRate = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : null;

  // Calculate percentile (comparison with other guides)
  let percentile = 50;
  if (onTimeRate !== null) {
    const { data: allGuides } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select('guide_id, is_late')
      .gte('check_in_at', period.start.toISOString())
      .lte('check_in_at', period.end.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    if (allGuides && allGuides.length > 0) {
      const guideStats = new Map<string, { total: number; onTime: number }>();

      for (const tg of allGuides) {
        const gId = (tg as { guide_id: string }).guide_id;
        const isLate = (tg as { is_late: boolean }).is_late;

        if (!guideStats.has(gId)) {
          guideStats.set(gId, { total: 0, onTime: 0 });
        }

        const stats = guideStats.get(gId);
        if (stats) {
          stats.total++;
          if (!isLate) {
            stats.onTime++;
          }
        }
      }

      const onTimeRates = Array.from(guideStats.values()).map(
        (s) => (s.onTime / s.total) * 100
      );
      onTimeRates.sort((a, b) => a - b);

      const userOnTimeRate = onTimeRate;
      const betterCount = onTimeRates.filter(
        (rate) => rate < userOnTimeRate
      ).length;
      percentile =
        onTimeRates.length > 0 ? (betterCount / onTimeRates.length) * 100 : 50;
    }
  }

  // Calculate overall score
  const ratingScore = ratings.average ? (ratings.average / 5) * 40 : 0;
  const tripsScore = Math.min((trips.completed / 10) * 30, 30);
  const earningsScore = Math.min((earnings.total / 5000000) * 30, 30);
  const overallScore = ratingScore + tripsScore + earningsScore;

  // Determine tier
  let performanceTier = 'needs_improvement';
  if (overallScore >= 80) performanceTier = 'excellent';
  else if (overallScore >= 65) performanceTier = 'good';
  else if (overallScore >= 50) performanceTier = 'average';

  return {
    score: overallScore,
    tier: performanceTier,
    onTimeRate,
    percentile: Math.round(percentile),
  };
}

/**
 * Calculate development metrics
 */
async function calculateDevelopmentMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any
) {
  // Get skills improved (simplified - count skills with level > 1)
  const { data: skills } = await client
    .from('guide_skills')
    .select('level, updated_at')
    .eq('guide_id', guideId)
    .gte('updated_at', period.start.toISOString())
    .lte('updated_at', period.end.toISOString())
    .gt('level', 1);

  const skillsImproved = skills?.length || 0;

  // Get assessments completed
  const { data: assessments } = await client
    .from('guide_assessments')
    .select('id')
    .eq('guide_id', guideId)
    .eq('status', 'completed')
    .gte('completed_at', period.start.toISOString())
    .lte('completed_at', period.end.toISOString());

  const assessmentsCompleted = assessments?.length || 0;

  return {
    skillsImproved,
    assessmentsCompleted,
  };
}

/**
 * Calculate customer satisfaction metrics
 */
async function calculateCustomerSatisfactionMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any
) {
  try {
    // Get reviews with responses
    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select('id, guide_response, guide_rating')
      .eq('guide_id', guideId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (reviewsError) {
      logger.warn(
        'Error fetching reviews for customer satisfaction',
        reviewsError,
        { guideId }
      );
    }

    const totalReviews = reviews?.length || 0;
    const respondedReviews =
      reviews?.filter((r: any) => r.guide_response).length || 0;
    const responseRate =
      totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : null;

    // Get customer satisfaction score from guide_performance_metrics if available
    let satisfactionScore: number | null = null;
    try {
      const { data: performanceMetrics } = await (client as any)
        .from('guide_performance_metrics')
        .select('customer_satisfaction_score')
        .eq('guide_id', guideId)
        .gte('period_start', period.start.toISOString().split('T')[0])
        .lte('period_end', period.end.toISOString().split('T')[0])
        .maybeSingle();
      satisfactionScore =
        performanceMetrics?.customer_satisfaction_score || null;
    } catch {
      // Table might not exist, continue
    }

    // Repeat customer rate - simplified (would need bookings table)
    const repeatCustomerRate: number | null = null; // TODO: Implement when bookings table is available

    // Complaint resolution rate - simplified (would need tickets table)
    const complaintResolutionRate: number | null = null; // TODO: Implement when tickets table is available

    return {
      responseRate,
      repeatCustomerRate,
      complaintResolutionRate,
      satisfactionScore,
    };
  } catch (error) {
    logger.error('Failed to calculate customer satisfaction metrics', error, {
      guideId,
    });
    return {
      responseRate: null,
      repeatCustomerRate: null,
      complaintResolutionRate: null,
      satisfactionScore: null,
    };
  }
}

/**
 * Calculate efficiency metrics
 */
async function calculateEfficiencyMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  trips: { total: number; completed: number; cancelled: number },
  earnings: { total: number; average: number; byTrip: number }
) {
  try {
    // Get trip guides with check-in/out times
    const { data: tripGuides, error: tripGuidesError } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select(
        'check_in_at, check_out_at, trip:trips(guest_count, scheduled_start_at)'
      )
      .eq('guide_id', guideId)
      .gte('check_in_at', period.start.toISOString())
      .lte('check_in_at', period.end.toISOString())
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    if (tripGuidesError) {
      logger.warn(
        'Error fetching trip guides for efficiency',
        tripGuidesError,
        { guideId }
      );
    }

    // Calculate average trip duration
    let avgTripDuration: number | null = null;
    let totalGuests = 0;
    if (tripGuides && tripGuides.length > 0) {
      let totalDuration = 0;
      let validDurations = 0;
      tripGuides.forEach((tg: any) => {
        if (tg.check_in_at && tg.check_out_at) {
          const checkIn = new Date(tg.check_in_at).getTime();
          const checkOut = new Date(tg.check_out_at).getTime();
          const durationHours = (checkOut - checkIn) / (1000 * 60 * 60);
          if (durationHours > 0 && durationHours < 168) {
            // Valid duration (less than 7 days)
            totalDuration += durationHours;
            validDurations++;
          }
        }
        if (tg.trip?.guest_count) {
          totalGuests += Number(tg.trip.guest_count) || 0;
        }
      });
      avgTripDuration =
        validDurations > 0 ? totalDuration / validDurations : null;
    }

    // Guest-to-trip ratio
    const guestToTripRatio =
      trips.completed > 0 ? totalGuests / trips.completed : null;

    // Revenue per guest
    const revenuePerGuest =
      totalGuests > 0 ? earnings.total / totalGuests : null;

    // Utilization rate - simplified (would need availability data)
    const utilizationRate: number | null = null; // TODO: Implement when availability data is available

    // Average response time - simplified (would need assignment timestamps)
    const avgResponseTime: number | null = null; // TODO: Implement when assignment data is available

    return {
      avgTripDuration,
      guestToTripRatio,
      revenuePerGuest,
      utilizationRate,
      avgResponseTime,
    };
  } catch (error) {
    logger.error('Failed to calculate efficiency metrics', error, { guideId });
    return {
      avgTripDuration: null,
      guestToTripRatio: null,
      revenuePerGuest: null,
      utilizationRate: null,
      avgResponseTime: null,
    };
  }
}

/**
 * Calculate financial metrics
 */
async function calculateFinancialMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  earnings: { total: number; average: number; byTrip: number }
) {
  try {
    // Get penalties
    let penaltiesQuery = client
      .from('salary_deductions')
      .select('amount')
      .eq('guide_id', guideId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      penaltiesQuery = penaltiesQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: penalties, error: penaltiesError } = await penaltiesQuery;

    if (penaltiesError) {
      logger.warn(
        'Error fetching penalties for financial metrics',
        penaltiesError,
        { guideId }
      );
    }

    const totalPenalties =
      penalties?.reduce(
        (sum: number, p: { amount: number }) => sum + (Number(p.amount) || 0),
        0
      ) || 0;

    // Net earnings
    const netEarnings = earnings.total - totalPenalties;

    // Penalty impact
    const penaltyImpact =
      earnings.total > 0 ? (totalPenalties / earnings.total) * 100 : 0;

    // Get wallet for savings rate
    const { data: wallet } = await withBranchFilter(
      client.from('guide_wallets'),
      branchContext
    )
      .select('id')
      .eq('guide_id', guideId)
      .maybeSingle();

    let savingsRate: number | null = null;
    if (wallet) {
      // Get savings goals
      const { data: goals } = await client
        .from('guide_wallet_goals')
        .select('auto_save_percentage')
        .eq('wallet_id', (wallet as { id: string }).id)
        .maybeSingle();
      savingsRate = goals?.auto_save_percentage || null;
    }

    // Withdrawal frequency
    const { data: withdrawals } = await client
      .from('guide_wallet_transactions')
      .select('id')
      .eq('wallet_id', wallet?.id)
      .eq('transaction_type', 'withdraw_request')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    const withdrawalFrequency = withdrawals?.length || 0;

    // Earnings trend (last 3-6 months) - simplified to last 3 months
    const earningsTrend: number[] = [];
    for (let i = 2; i >= 0; i--) {
      const trendPeriodStart = new Date(period.start);
      trendPeriodStart.setMonth(trendPeriodStart.getMonth() - i);
      const trendPeriodEnd = new Date(trendPeriodStart);
      trendPeriodEnd.setMonth(trendPeriodEnd.getMonth() + 1);
      trendPeriodEnd.setDate(0); // Last day of month

      // Get earnings for this period (simplified)
      const { data: trendWallet } = await withBranchFilter(
        client.from('guide_wallets'),
        branchContext
      )
        .select('id')
        .eq('guide_id', guideId)
        .maybeSingle();

      if (trendWallet) {
        const { data: trendTransactions } = await client
          .from('guide_wallet_transactions')
          .select('amount')
          .eq('wallet_id', (trendWallet as { id: string }).id)
          .eq('transaction_type', 'earning')
          .gte('created_at', trendPeriodStart.toISOString())
          .lte('created_at', trendPeriodEnd.toISOString());

        const trendEarnings =
          trendTransactions?.reduce(
            (sum: number, t: { amount: number }) =>
              sum + (Number(t.amount) || 0),
            0
          ) || 0;
        earningsTrend.push(trendEarnings);
      } else {
        earningsTrend.push(0);
      }
    }

    return {
      netEarnings,
      penaltyImpact,
      savingsRate,
      withdrawalFrequency,
      earningsTrend,
    };
  } catch (error) {
    logger.error('Failed to calculate financial metrics', error, { guideId });
    return {
      netEarnings: earnings.total,
      penaltyImpact: 0,
      savingsRate: null,
      withdrawalFrequency: 0,
      earningsTrend: [],
    };
  }
}

/**
 * Calculate quality metrics
 */
async function calculateQualityMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any
) {
  try {
    const { data: tripGuides, error: tripGuidesError } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext
    )
      .select(
        'is_late, documentation_uploaded, trip:trips(status, scheduled_end_at), check_out_at'
      )
      .eq('guide_id', guideId)
      .gte('check_in_at', period.start.toISOString())
      .lte('check_in_at', period.end.toISOString());

    if (tripGuidesError) {
      logger.warn(
        'Error fetching trip guides for quality metrics',
        tripGuidesError,
        { guideId }
      );
    }

    const totalTrips = tripGuides?.length || 0;
    if (totalTrips === 0) {
      return {
        onTimeCompletionRate: null,
        noShowRate: null,
        documentationCompletionRate: null,
        issueResolutionRate: null,
        lateCheckInRate: null,
      };
    }

    // Late check-in rate
    const lateCheckIns =
      tripGuides?.filter((tg: any) => tg.is_late === true).length || 0;
    const lateCheckInRate =
      totalTrips > 0 ? (lateCheckIns / totalTrips) * 100 : null;

    // Documentation completion rate
    const documentedTrips =
      tripGuides?.filter((tg: any) => tg.documentation_uploaded === true)
        .length || 0;
    const documentationCompletionRate =
      totalTrips > 0 ? (documentedTrips / totalTrips) * 100 : null;

    // On-time completion rate
    let onTimeCompletions = 0;
    let completedTrips = 0;
    tripGuides?.forEach((tg: any) => {
      if (
        tg.trip?.status === 'completed' &&
        tg.check_out_at &&
        tg.trip.scheduled_end_at
      ) {
        completedTrips++;
        const checkOutTime = new Date(tg.check_out_at).getTime();
        const scheduledEndTime = new Date(tg.trip.scheduled_end_at).getTime();
        // Consider on-time if completed within 30 minutes of scheduled end
        if (
          checkOutTime >= scheduledEndTime - 30 * 60 * 1000 &&
          checkOutTime <= scheduledEndTime + 30 * 60 * 1000
        ) {
          onTimeCompletions++;
        }
      }
    });
    const onTimeCompletionRate =
      completedTrips > 0 ? (onTimeCompletions / completedTrips) * 100 : null;

    // No-show rate (cancelled by guide)
    const cancelledByGuide =
      tripGuides?.filter((tg: any) => tg.trip?.status === 'cancelled').length ||
      0;
    const noShowRate =
      totalTrips > 0 ? (cancelledByGuide / totalTrips) * 100 : null;

    // Issue resolution rate - simplified (would need tickets/issues table)
    const issueResolutionRate: number | null = null; // TODO: Implement when issues table is available

    return {
      onTimeCompletionRate,
      noShowRate,
      documentationCompletionRate,
      issueResolutionRate,
      lateCheckInRate,
    };
  } catch (error) {
    logger.error('Failed to calculate quality metrics', error, { guideId });
    return {
      onTimeCompletionRate: null,
      noShowRate: null,
      documentationCompletionRate: null,
      issueResolutionRate: null,
      lateCheckInRate: null,
    };
  }
}

/**
 * Calculate growth metrics
 */
async function calculateGrowthMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  currentMetrics: UnifiedMetrics,
  previousMetrics: UnifiedMetrics
) {
  try {
    // Month-over-month growth
    const tripsGrowth =
      previousMetrics.trips.total > 0
        ? ((currentMetrics.trips.total - previousMetrics.trips.total) /
            previousMetrics.trips.total) *
          100
        : null;
    const earningsGrowth =
      previousMetrics.earnings.total > 0
        ? ((currentMetrics.earnings.total - previousMetrics.earnings.total) /
            previousMetrics.earnings.total) *
          100
        : null;
    const ratingsGrowth =
      previousMetrics.ratings.average && currentMetrics.ratings.average
        ? ((currentMetrics.ratings.average - previousMetrics.ratings.average) /
            previousMetrics.ratings.average) *
          100
        : null;

    // Skill progression rate
    const { data: skills } = await withBranchFilter(
      client.from('guide_skills'),
      branchContext
    )
      .select('level')
      .eq('guide_id', guideId)
      .gte('updated_at', period.start.toISOString())
      .lte('updated_at', period.end.toISOString());

    const avgSkillLevel =
      skills && skills.length > 0
        ? skills.reduce(
            (sum: number, s: { level: number }) => sum + (Number(s.level) || 0),
            0
          ) / skills.length
        : null;

    // Get previous period skills for comparison
    const previousPeriod = getPreviousPeriod(period);
    const { data: previousSkills } = await withBranchFilter(
      client.from('guide_skills'),
      branchContext
    )
      .select('level')
      .eq('guide_id', guideId)
      .gte('updated_at', previousPeriod.start.toISOString())
      .lte('updated_at', previousPeriod.end.toISOString());

    const previousAvgSkillLevel =
      previousSkills && previousSkills.length > 0
        ? previousSkills.reduce(
            (sum: number, s: { level: number }) => sum + (Number(s.level) || 0),
            0
          ) / previousSkills.length
        : null;

    const skillProgressionRate =
      previousAvgSkillLevel && avgSkillLevel
        ? ((avgSkillLevel - previousAvgSkillLevel) / previousAvgSkillLevel) *
          100
        : null;

    // Certification completion rate
    const { data: certifications } = await client
      .from('guide_skills')
      .select('certified')
      .eq('guide_id', guideId)
      .eq('certified', true);
    const { count: totalSkillsCount } = await client
      .from('guide_skills')
      .select('*', { count: 'exact', head: true })
      .eq('guide_id', guideId);
    const certificationCompletionRate =
      totalSkillsCount && totalSkillsCount > 0
        ? ((certifications?.length || 0) / totalSkillsCount) * 100
        : null;

    // Assessment improvement
    const { data: assessments } = await client
      .from('guide_assessments')
      .select('score')
      .eq('guide_id', guideId)
      .eq('status', 'completed')
      .gte('completed_at', period.start.toISOString())
      .lte('completed_at', period.end.toISOString())
      .order('completed_at', { ascending: false })
      .limit(5);

    const { data: previousAssessments } = await client
      .from('guide_assessments')
      .select('score')
      .eq('guide_id', guideId)
      .eq('status', 'completed')
      .gte('completed_at', previousPeriod.start.toISOString())
      .lte('completed_at', previousPeriod.end.toISOString())
      .order('completed_at', { ascending: false })
      .limit(5);

    const currentAvgScore =
      assessments && assessments.length > 0
        ? assessments.reduce(
            (sum: number, a: { score: number }) => sum + (Number(a.score) || 0),
            0
          ) / assessments.length
        : null;
    const previousAvgScore =
      previousAssessments && previousAssessments.length > 0
        ? previousAssessments.reduce(
            (sum: number, a: { score: number }) => sum + (Number(a.score) || 0),
            0
          ) / previousAssessments.length
        : null;

    const assessmentImprovement =
      previousAvgScore && currentAvgScore
        ? ((currentAvgScore - previousAvgScore) / previousAvgScore) * 100
        : null;

    return {
      momGrowth: {
        trips: tripsGrowth,
        earnings: earningsGrowth,
        ratings: ratingsGrowth,
      },
      skillProgressionRate,
      certificationCompletionRate,
      assessmentImprovement,
    };
  } catch (error) {
    logger.error('Failed to calculate growth metrics', error, { guideId });
    return {
      momGrowth: {
        trips: null,
        earnings: null,
        ratings: null,
      },
      skillProgressionRate: null,
      certificationCompletionRate: null,
      assessmentImprovement: null,
    };
  }
}

/**
 * Calculate comparative metrics
 */
async function calculateComparativeMetrics(
  guideId: string,
  period: PeriodConfig,
  branchContext: Awaited<ReturnType<typeof getBranchContext>>,
  client: any,
  metrics: UnifiedMetrics
) {
  try {
    if (!branchContext.branchId) {
      // Cannot calculate comparative metrics without branch context
      return {
        peerRanking: null,
        percentileImprovement: null,
        topPerformerGap: {
          trips: null,
          earnings: null,
          ratings: null,
        },
        marketShare: null,
      };
    }

    // Get all guides in the same branch
    const { data: allGuides, error: allGuidesError } = await client
      .from('users')
      .select('id')
      .eq('branch_id', branchContext.branchId)
      .eq('role', 'guide');

    if (allGuidesError || !allGuides) {
      logger.warn(
        'Error fetching guides for comparative metrics',
        allGuidesError,
        { guideId }
      );
      return {
        peerRanking: null,
        percentileImprovement: null,
        topPerformerGap: {
          trips: null,
          earnings: null,
          ratings: null,
        },
        marketShare: null,
      };
    }

    const guideIds = allGuides.map((g: { id: string }) => g.id);

    // Calculate metrics for all guides (simplified - would be expensive, consider caching)
    const allMetrics: Array<{
      guideId: string;
      trips: number;
      earnings: number;
      ratings: number | null;
    }> = [];

    for (const gId of guideIds.slice(0, 50)) {
      // Limit to 50 guides for performance
      try {
        const guideMetrics = await calculateUnifiedMetrics(gId, period, {
          include: ['trips', 'earnings', 'ratings'],
          calculateTrends: false,
          compareWithPrevious: false,
        });
        allMetrics.push({
          guideId: gId,
          trips: guideMetrics.trips.total,
          earnings: guideMetrics.earnings.total,
          ratings: guideMetrics.ratings.average,
        });
      } catch {
        // Skip if calculation fails
      }
    }

    // Calculate rankings
    const sortedByTrips = [...allMetrics].sort((a, b) => b.trips - a.trips);
    const sortedByEarnings = [...allMetrics].sort(
      (a, b) => b.earnings - a.earnings
    );
    const sortedByRatings = [...allMetrics]
      .filter((m) => m.ratings !== null)
      .sort((a, b) => (b.ratings || 0) - (a.ratings || 0));

    const tripsRank = sortedByTrips.findIndex((m) => m.guideId === guideId) + 1;
    const earningsRank =
      sortedByEarnings.findIndex((m) => m.guideId === guideId) + 1;
    const ratingsRank =
      sortedByRatings.findIndex((m) => m.guideId === guideId) + 1;

    // Use average rank as peer ranking
    const ranks = [tripsRank, earningsRank, ratingsRank].filter((r) => r > 0);
    const peerRanking =
      ranks.length > 0
        ? ranks.reduce((sum, r) => sum + r, 0) / ranks.length
        : null;

    // Top performer gaps
    const topTrips = sortedByTrips[0]?.trips || 0;
    const topEarnings = sortedByEarnings[0]?.earnings || 0;
    const topRatings = sortedByRatings[0]?.ratings || null;

    const topPerformerGap = {
      trips:
        topTrips > 0
          ? ((topTrips - metrics.trips.total) / topTrips) * 100
          : null,
      earnings:
        topEarnings > 0
          ? ((topEarnings - metrics.earnings.total) / topEarnings) * 100
          : null,
      ratings:
        topRatings && metrics.ratings.average
          ? ((topRatings - metrics.ratings.average) / topRatings) * 100
          : null,
    };

    // Percentile improvement - simplified (would need previous period comparison)
    const percentileImprovement: number | null = null; // TODO: Calculate from previous period

    // Market share - simplified
    const totalTripsInBranch = allMetrics.reduce((sum, m) => sum + m.trips, 0);
    const marketShare =
      totalTripsInBranch > 0
        ? (metrics.trips.total / totalTripsInBranch) * 100
        : null;

    return {
      peerRanking,
      percentileImprovement,
      topPerformerGap,
      marketShare,
    };
  } catch (error) {
    logger.error('Failed to calculate comparative metrics', error, { guideId });
    return {
      peerRanking: null,
      percentileImprovement: null,
      topPerformerGap: {
        trips: null,
        earnings: null,
        ratings: null,
      },
      marketShare: null,
    };
  }
}

/**
 * Map existing metrics from database to unified format
 */
function mapExistingMetricsToUnified(
  existing: any,
  period: PeriodConfig
): UnifiedMetrics {
  return {
    period: {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      type: period.type,
    },
    trips: {
      total: existing.total_trips || 0,
      completed: existing.completed_trips || 0,
      cancelled: existing.cancelled_trips || 0,
    },
    earnings: {
      total: existing.total_earnings || 0,
      average: existing.average_per_trip || 0,
      byTrip: 0, // Not stored in existing metrics
    },
    ratings: {
      average: existing.average_rating,
      total: existing.total_ratings || 0,
      trend: [],
    },
    performance: {
      score: existing.overall_score,
      tier: existing.performance_tier,
      onTimeRate: existing.on_time_rate,
      percentile: 50, // Not stored in existing metrics
    },
    development: {
      skillsImproved: existing.skills_improved || 0,
      assessmentsCompleted: existing.assessments_completed || 0,
    },
  };
}

/**
 * Get previous period for comparison
 */
function getPreviousPeriod(period: PeriodConfig): PeriodConfig {
  const start = new Date(period.start);
  const end = new Date(period.end);
  const diff = end.getTime() - start.getTime();

  return {
    start: new Date(start.getTime() - diff),
    end: new Date(start.getTime() - 1),
    type: period.type,
  };
}
