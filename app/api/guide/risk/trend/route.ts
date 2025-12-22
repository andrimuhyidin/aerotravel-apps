/**
 * API: Risk Trend Chart Data
 * GET /api/guide/risk/trend - Get historical risk assessment data for trend analysis
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

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');
  const days = parseInt(searchParams.get('days') || '30', 10); // Default 30 days
  const groupBy = searchParams.get('groupBy') || 'day'; // 'day', 'week', 'month'

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Calculate date threshold
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Build query
  let query = withBranchFilter(
    client.from('pre_trip_assessments'),
    branchContext,
  )
    .select('id, trip_id, risk_score, risk_level, is_safe, created_at, trip:trips(trip_code, trip_date)')
    .gte('created_at', dateThreshold)
    .order('created_at', { ascending: true });

  if (tripId) {
    query = query.eq('trip_id', tripId);
  } else {
    // Only get assessments for trips assigned to this guide
    query = query.eq('guide_id', user.id);
  }

  const { data: assessments, error } = await query;

  if (error) {
    logger.error('Failed to fetch risk assessments', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch risk assessments' }, { status: 500 });
  }

  // Group data by time period
  const groupedData: Record<string, {
    date: string;
    count: number;
    avgRiskScore: number;
    minRiskScore: number;
    maxRiskScore: number;
    safeCount: number;
    unsafeCount: number;
    riskLevels: Record<string, number>;
  }> = {};

  (assessments || []).forEach((assessment: any) => {
    const date = new Date(assessment.created_at);
    let key: string;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0] ?? date.toISOString().substring(0, 10); // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      key = weekStart.toISOString().split('T')[0] ?? weekStart.toISOString().substring(0, 10);
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        date: key,
        count: 0,
        avgRiskScore: 0,
        minRiskScore: Infinity,
        maxRiskScore: -Infinity,
        safeCount: 0,
        unsafeCount: 0,
        riskLevels: {},
      };
    }

    const group = groupedData[key]!;
    const riskScore = assessment.risk_score as number || 0;

    group.count++;
    group.avgRiskScore += riskScore;
    group.minRiskScore = Math.min(group.minRiskScore, riskScore);
    group.maxRiskScore = Math.max(group.maxRiskScore, riskScore);

    if (assessment.is_safe) {
      group.safeCount++;
    } else {
      group.unsafeCount++;
    }

    const riskLevel = assessment.risk_level as string || 'unknown';
    group.riskLevels[riskLevel] = (group.riskLevels[riskLevel] || 0) + 1;
  });

  // Calculate averages and format data
  const trendData = Object.values(groupedData)
    .map((group) => ({
      date: group.date,
      count: group.count,
      avgRiskScore: group.count > 0 ? group.avgRiskScore / group.count : 0,
      minRiskScore: group.minRiskScore === Infinity ? 0 : group.minRiskScore,
      maxRiskScore: group.maxRiskScore === -Infinity ? 0 : group.maxRiskScore,
      safeCount: group.safeCount,
      unsafeCount: group.unsafeCount,
      safePercentage: group.count > 0 ? (group.safeCount / group.count) * 100 : 0,
      riskLevels: group.riskLevels,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate overall statistics
  const totalAssessments = assessments?.length || 0;
  const avgRiskScore = totalAssessments > 0
    ? (assessments || []).reduce((sum: number, a: any) => sum + (a.risk_score || 0), 0) / totalAssessments
    : 0;
  const safeCount = (assessments || []).filter((a: any) => a.is_safe).length;
  const unsafeCount = totalAssessments - safeCount;

  return NextResponse.json({
    trendData,
    statistics: {
      total: totalAssessments,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      safeCount,
      unsafeCount,
      safePercentage: totalAssessments > 0 ? Math.round((safeCount / totalAssessments) * 100 * 100) / 100 : 0,
    },
    period: {
      days,
      groupBy,
      startDate: dateThreshold,
      endDate: new Date().toISOString(),
    },
  });
});

