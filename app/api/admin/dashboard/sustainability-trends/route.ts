/**
 * API: Sustainability Trends
 * GET /api/admin/dashboard/sustainability-trends - Get sustainability trends chart data
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getBranchContext,
  withBranchFilter,
} from '@/lib/branch/branch-injection';
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

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    userProfile?.role !== 'super_admin' &&
    userProfile?.role !== 'ops_admin'
  ) {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  const branchContext = await getBranchContext(user.id);
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly'; // monthly, quarterly, yearly
  const months = parseInt(searchParams.get('months') || '6', 10);

  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);

    // Get fuel logs for trend
    const { data: fuelLogs, error: fuelLogsError } = await withBranchFilter(
      client.from('trip_fuel_logs'),
      branchContext
    )
      .select('logged_at, co2_emissions_kg, fuel_liters')
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    if (fuelLogsError) {
      logger.error('Failed to fetch fuel logs for trends', fuelLogsError);
      return NextResponse.json(
        { error: 'Failed to fetch fuel logs' },
        { status: 500 }
      );
    }

    // Get waste logs for trend
    const { data: wasteLogs, error: wasteLogsError } = await withBranchFilter(
      client.from('waste_logs'),
      branchContext
    )
      .select('logged_at, quantity, unit')
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    if (wasteLogsError) {
      logger.error('Failed to fetch waste logs for trends', wasteLogsError);
      return NextResponse.json(
        { error: 'Failed to fetch waste logs' },
        { status: 500 }
      );
    }

    // Aggregate by period
    const aggregateByPeriod = (
      data: unknown[],
      dateField: string,
      valueField: string,
      periodType: string
    ): Array<{ date: string; value: number }> => {
      const grouped: Record<string, { date: string; value: number }> = {};

      data.forEach((item: any) => {
        const date = new Date(item[dateField]);
        let key: string;

        if (periodType === 'monthly') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (periodType === 'quarterly') {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
        } else {
          key = String(date.getFullYear());
        }

        if (!grouped[key]) {
          grouped[key] = { date: key, value: 0 };
        }

        const group = grouped[key];
        if (group) {
          group.value += Number(item[valueField] || 0);
        }
      });

      return Object.values(grouped).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    };

    // Calculate CO2 trends
    const co2Trends = aggregateByPeriod(
      fuelLogs || [],
      'logged_at',
      'co2_emissions_kg',
      period
    );

    // Calculate waste trends (convert all to kg)
    const wasteData = (wasteLogs || []).map((log: any) => {
      let kgValue = Number(log.quantity || 0);
      if (log.unit === 'pieces') {
        // Rough estimate: 1 piece = 0.05 kg (average for plastic bottles, etc.)
        kgValue = kgValue * 0.05;
      }
      return {
        ...log,
        quantity_kg: kgValue,
      };
    });

    const wasteTrends = aggregateByPeriod(
      wasteData,
      'logged_at',
      'quantity_kg',
      period
    );

    // Get goals for the period
    const { data: goals } = await client
      .from('sustainability_goals')
      .select('*')
      .eq('period_type', period)
      .eq('branch_id', branchContext.branchId)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .order('period_start', { ascending: true });

    // Map goals to trend data
    const co2TrendsWithGoals = co2Trends.map((trend) => {
      const goal = goals?.find((g: any) => {
        const goalStart = new Date(g.period_start);
        const trendDate = new Date(
          trend.date + (period === 'monthly' ? '-01' : '')
        );
        return (
          goalStart.getTime() <= trendDate.getTime() &&
          new Date(g.period_end).getTime() >= trendDate.getTime()
        );
      });

      return {
        ...trend,
        goal: goal ? Number(goal.target_co2_kg || 0) : null,
        status:
          goal && goal.target_co2_kg
            ? trend.value <= goal.target_co2_kg
              ? 'on_target'
              : 'exceeded'
            : null,
      };
    });

    const wasteTrendsWithGoals = wasteTrends.map((trend) => {
      const goal = goals?.find((g: any) => {
        const goalStart = new Date(g.period_start);
        const trendDate = new Date(
          trend.date + (period === 'monthly' ? '-01' : '')
        );
        return (
          goalStart.getTime() <= trendDate.getTime() &&
          new Date(g.period_end).getTime() >= trendDate.getTime()
        );
      });

      return {
        ...trend,
        goal: goal ? Number(goal.target_waste_kg || 0) : null,
        status:
          goal && goal.target_waste_kg
            ? trend.value <= goal.target_waste_kg
              ? 'on_target'
              : 'exceeded'
            : null,
      };
    });

    return NextResponse.json({
      period_type: period,
      months_analyzed: months,
      co2_trends: co2TrendsWithGoals,
      waste_trends: wasteTrendsWithGoals,
      summary: {
        total_co2_kg: co2Trends.reduce((sum, t) => sum + t.value, 0),
        total_waste_kg: wasteTrends.reduce((sum, t) => sum + t.value, 0),
        avg_co2_per_period:
          co2Trends.length > 0
            ? co2Trends.reduce((sum, t) => sum + t.value, 0) / co2Trends.length
            : 0,
        avg_waste_per_period:
          wasteTrends.length > 0
            ? wasteTrends.reduce((sum, t) => sum + t.value, 0) /
              wasteTrends.length
            : 0,
      },
    });
  } catch (error) {
    logger.error('Failed to generate sustainability trends', error);
    return NextResponse.json(
      { error: 'Failed to generate trends' },
      { status: 500 }
    );
  }
});
