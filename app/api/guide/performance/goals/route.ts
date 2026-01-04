/**
 * API: Performance Goals
 * GET /api/guide/performance/goals - Get goals for current/selected period
 * POST /api/guide/performance/goals - Create/update goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const goalSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  targetTrips: z.number().int().min(0).optional(),
  targetRating: z.number().min(0).max(5).optional(),
  targetIncome: z.number().min(0).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year') ?? '2025')
    : new Date().getFullYear();
  const month = searchParams.get('month')
    ? parseInt(searchParams.get('month') ?? '1')
    : new Date().getMonth() + 1;

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  // Get goal for period
  let goalQuery = supabase
    .from('guide_performance_goals')
    .select('*')
    .eq('guide_id', user.id);
  
  if (branchContext.branchId) {
    goalQuery = goalQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: goal, error: goalError } = await goalQuery
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (goalError) {
    logger.error('Failed to fetch performance goal', goalError, { guideId: user.id, year, month });
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }

  // Calculate current progress from actual data
  const now = new Date();
  const targetYear = year;
  const targetMonth = month;
  const periodStart = new Date(targetYear, targetMonth - 1, 1);
  const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // Get current trips count
  const { count: tripsCount } = await supabase
    .from('trip_guides')
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', user.id)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  // Get current rating (average from reviews)
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('guide_rating')
    .eq('guide_id', user.id)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  const currentRating =
    reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + (r.guide_rating ?? 0), 0) / reviewsData.length
      : 0;

  // Get current income (from wallet transactions)
  const { data: incomeData } = await supabase
    .from('guide_wallet_transactions')
    .select('amount')
    .eq('guide_id', user.id)
    .eq('type', 'earning')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString());

  const currentIncome =
    incomeData?.reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0) ?? 0;

  // Update goal with current progress if exists
  if (goal) {
    await supabase
      .from('guide_performance_goals')
      .update({
        current_trips: tripsCount ?? 0,
        current_rating: currentRating,
        current_income: currentIncome,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (goal as { id: string }).id);
  }

  return NextResponse.json({
    goal: goal
      ? {
          ...goal,
          current_trips: tripsCount ?? 0,
          current_rating: currentRating,
          current_income: currentIncome,
        }
      : null,
    current: {
      trips: tripsCount ?? 0,
      rating: currentRating,
      income: currentIncome,
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = goalSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  if (!branchContext.branchId) {
    return NextResponse.json({ error: 'Branch context required for this operation' }, { status: 400 });
  }

  // Check if goal exists
  const { data: existing } = await supabase
    .from('guide_performance_goals')
    .select('id')
    .eq('guide_id', user.id)
    .eq('branch_id', branchContext.branchId)
    .eq('year', payload.year)
    .eq('month', payload.month)
    .maybeSingle();

  const goalData = {
    guide_id: user.id,
    branch_id: branchContext.branchId,
    year: payload.year,
    month: payload.month,
    target_trips: payload.targetTrips ?? 0,
    target_rating: payload.targetRating ?? 0,
    target_income: payload.targetIncome ?? 0,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('guide_performance_goals')
      .update(goalData)
      .eq('id', (existing as { id: string }).id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update performance goal', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('guide_performance_goals')
    .insert({
      ...goalData,
    })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create performance goal', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    result = data;
  }

  logger.info('Performance goal saved', {
    goalId: result.id,
    guideId: user.id,
    year: payload.year,
    month: payload.month,
  });

  return NextResponse.json({
    success: true,
    goal: result,
  });
});

