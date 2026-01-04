/**
 * API: Guide Wallet Savings Goals
 * GET  /api/guide/wallet/goals - Get savings goals
 * POST /api/guide/wallet/goals - Create/update savings goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const goalSchema = z.object({
  name: z.string().min(1).max(255),
  targetAmount: z.number().positive(),
  autoSavePercent: z.number().min(0).max(100).optional(),
  autoSaveEnabled: z.boolean().optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if table exists (graceful fallback if migration not applied)
    const { data: goals, error } = await client
      .from('guide_savings_goals')
      .select('id, name, target_amount, current_amount, auto_save_percent, auto_save_enabled, is_completed, completed_at, created_at')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        logger.warn('guide_savings_goals table not found. Migration may not be applied yet.', { guideId: user.id });
        return NextResponse.json({ goals: [] });
      }
      logger.error('Failed to fetch savings goals', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    const formattedGoals = (goals || []).map((g: {
      id: string;
      name: string;
      target_amount: number;
      current_amount: number;
      auto_save_percent: number;
      auto_save_enabled: boolean;
      is_completed: boolean;
      completed_at: string | null;
      created_at: string;
    }) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount || 0),
      currentAmount: Number(g.current_amount || 0),
      progress: g.target_amount > 0 ? (Number(g.current_amount || 0) / Number(g.target_amount || 1)) * 100 : 0,
      autoSavePercent: Number(g.auto_save_percent || 0),
      autoSaveEnabled: g.auto_save_enabled || false,
      isCompleted: g.is_completed || false,
      completedAt: g.completed_at,
      createdAt: g.created_at,
    }));

    return NextResponse.json({ goals: formattedGoals });
  } catch (error) {
    logger.error('Failed to fetch savings goals', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as unknown;

  let parsed;
  try {
    parsed = goalSchema.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid goal data' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if table exists
    const { data: goal, error } = await client
      .from('guide_savings_goals')
      .insert({
        guide_id: user.id,
        name: parsed.name,
        target_amount: parsed.targetAmount,
        current_amount: 0,
        auto_save_percent: parsed.autoSavePercent || 0,
        auto_save_enabled: parsed.autoSaveEnabled || false,
      })
      .select('id, name, target_amount, current_amount, auto_save_percent, auto_save_enabled, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        logger.warn('guide_savings_goals table not found. Migration may not be applied yet.', { guideId: user.id });
        return NextResponse.json({ error: 'Fitur savings goals belum tersedia. Silakan hubungi admin untuk mengaktifkan migration.' }, { status: 503 });
      }
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json({ error: 'Goal dengan nama ini sudah ada' }, { status: 400 });
      }
      logger.error('Failed to create savings goal', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.target_amount || 0),
        currentAmount: Number(goal.current_amount || 0),
        progress: 0,
        autoSavePercent: Number(goal.auto_save_percent || 0),
        autoSaveEnabled: goal.auto_save_enabled || false,
        isCompleted: false,
        createdAt: goal.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to create savings goal', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
});

