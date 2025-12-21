/**
 * API: Carbon Footprint Report
 * GET /api/admin/reports/carbon-footprint - Get carbon footprint report with monthly/quarterly aggregation
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const branchId = searchParams.get('branch_id');

  // Build date range
  const now = new Date();
  const reportMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
  const reportYear = year ? parseInt(year, 10) : now.getFullYear();
  const startDate = new Date(reportYear, reportMonth - 1, 1);
  const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

  try {
    // Get fuel logs for the period
    let fuelLogsQuery = client.from('trip_fuel_logs').select(`
      *,
      trip:trips(
        id,
        trip_code,
        name,
        departure_date
      )
    `);

    if (branchId && branchContext.isSuperAdmin) {
      fuelLogsQuery = fuelLogsQuery.eq('branch_id', branchId);
    } else if (branchContext.branchId && !branchContext.isSuperAdmin) {
      fuelLogsQuery = fuelLogsQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: fuelLogs, error: fuelLogsError } = await fuelLogsQuery
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: false });

    if (fuelLogsError) {
      logger.error('Failed to fetch fuel logs', fuelLogsError, { month: reportMonth, year: reportYear });
      return NextResponse.json({ error: 'Failed to fetch fuel logs' }, { status: 500 });
    }

    // Calculate totals
    const totalFuelLiters = (fuelLogs || []).reduce((sum: number, log: any) => sum + Number(log.fuel_liters || 0), 0);
    const totalCO2 = (fuelLogs || []).reduce((sum: number, log: any) => sum + Number(log.co2_emissions_kg || 0), 0);
    const totalDistance = (fuelLogs || []).reduce((sum: number, log: any) => sum + Number(log.distance_nm || 0), 0);

  // Get sustainability goal for this period
  const goalBranchId = branchId || branchContext.branchId;
  const { data: goal } = goalBranchId
    ? await client
        .from('sustainability_goals')
        .select('*')
        .eq('period_type', 'monthly')
        .eq('branch_id', goalBranchId)
        .lte('period_start', startDate.toISOString().split('T')[0])
        .gte('period_end', endDate.toISOString().split('T')[0])
        .maybeSingle()
    : { data: null };

    // Calculate trend (compare with previous month)
    const prevMonth = reportMonth === 1 ? 12 : reportMonth - 1;
    const prevYear = reportMonth === 1 ? reportYear - 1 : reportYear;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const { data: prevFuelLogs } = await withBranchFilter(
      client.from('trip_fuel_logs'),
      branchContext,
    )
      .select('co2_emissions_kg')
      .gte('logged_at', prevStartDate.toISOString())
      .lte('logged_at', prevEndDate.toISOString());

    const prevTotalCO2 = (prevFuelLogs || []).reduce((sum: number, log: any) => sum + Number(log.co2_emissions_kg || 0), 0);
    const co2Trend = prevTotalCO2 > 0 ? ((totalCO2 - prevTotalCO2) / prevTotalCO2) * 100 : 0;

    // Per-trip breakdown
    const tripBreakdown = (fuelLogs || []).map((log: any) => ({
      trip_id: log.trip_id,
      trip_code: log.trip?.trip_code || null,
      trip_name: log.trip?.name || null,
      fuel_liters: Number(log.fuel_liters || 0),
      fuel_type: log.fuel_type,
      distance_nm: Number(log.distance_nm || 0),
      co2_emissions_kg: Number(log.co2_emissions_kg || 0),
      logged_at: log.logged_at,
    }));

    return NextResponse.json({
      period: {
        month: reportMonth,
        year: reportYear,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
      summary: {
        total_fuel_liters: Number(totalFuelLiters.toFixed(2)),
        total_co2_kg: Number(totalCO2.toFixed(2)),
        total_distance_nm: Number(totalDistance.toFixed(2)),
        trip_count: fuelLogs?.length || 0,
        co2_trend_percent: Number(co2Trend.toFixed(2)),
      },
      goal: goal ? {
        target_co2_kg: Number(goal.target_co2_kg || 0),
        actual_co2_kg: Number(totalCO2.toFixed(2)),
        progress_percent: goal.target_co2_kg > 0
          ? Number(((totalCO2 / goal.target_co2_kg) * 100).toFixed(2))
          : null,
        status: goal.target_co2_kg > 0 && totalCO2 <= goal.target_co2_kg ? 'on_target' : 'exceeded',
      } : null,
      trip_breakdown: tripBreakdown,
    });
  } catch (error) {
    logger.error('Failed to generate carbon footprint report', error, { month: reportMonth, year: reportYear });
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
});

