/**
 * API: Guide Wallet Savings Goals - Individual Goal Operations
 * PUT    /api/guide/wallet/goals/[id] - Update goal
 * DELETE /api/guide/wallet/goals/[id] - Delete goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateGoalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  autoSavePercent: z.number().min(0).max(100).optional(),
  autoSaveEnabled: z.boolean().optional(),
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: goalId } = await params;

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
  }

  const body = (await request.json()) as unknown;

  let parsed;
  try {
    parsed = updateGoalSchema.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid goal data' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if goal exists and belongs to user
    const { data: existingGoal, error: checkError } = await client
      .from('guide_savings_goals')
      .select('id, guide_id, target_amount')
      .eq('id', goalId)
      .eq('guide_id', user.id)
      .single();

    if (checkError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.targetAmount !== undefined) {
      updateData.target_amount = parsed.targetAmount;
      // Re-check completion status if target changed
      const currentAmount = parsed.currentAmount !== undefined 
        ? parsed.currentAmount 
        : (existingGoal as { current_amount?: number }).current_amount || 0;
      if (currentAmount >= parsed.targetAmount) {
        updateData.is_completed = true;
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (parsed.currentAmount !== undefined) {
      updateData.current_amount = parsed.currentAmount;
      // Check if goal is completed
      const targetAmount = parsed.targetAmount !== undefined 
        ? parsed.targetAmount 
        : Number((existingGoal as { target_amount: number }).target_amount || 0);
      if (parsed.currentAmount >= targetAmount) {
        updateData.is_completed = true;
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.is_completed = false;
        updateData.completed_at = null;
      }
    }
    if (parsed.autoSavePercent !== undefined) updateData.auto_save_percent = parsed.autoSavePercent;
    if (parsed.autoSaveEnabled !== undefined) updateData.auto_save_enabled = parsed.autoSaveEnabled;

    // Update goal
    const { data: updatedGoal, error: updateError } = await client
      .from('guide_savings_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('guide_id', user.id)
      .select('id, name, target_amount, current_amount, auto_save_percent, auto_save_enabled, is_completed, completed_at, created_at, updated_at')
      .single();

    if (updateError) {
      logger.error('Failed to update savings goal', updateError, { guideId: user.id, goalId });
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    const goal = updatedGoal as {
      id: string;
      name: string;
      target_amount: number;
      current_amount: number;
      auto_save_percent: number;
      auto_save_enabled: boolean;
      is_completed: boolean;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    };

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.target_amount || 0),
        currentAmount: Number(goal.current_amount || 0),
        progress: goal.target_amount > 0 ? (Number(goal.current_amount || 0) / Number(goal.target_amount || 1)) * 100 : 0,
        autoSavePercent: Number(goal.auto_save_percent || 0),
        autoSaveEnabled: goal.auto_save_enabled || false,
        isCompleted: goal.is_completed || false,
        completedAt: goal.completed_at,
        createdAt: goal.created_at,
        updatedAt: goal.updated_at,
      },
    });
  } catch (error) {
    logger.error('Failed to update savings goal', error, { guideId: user.id, goalId });
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: goalId } = await params;

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if goal exists and belongs to user
    const { data: existingGoal, error: checkError } = await client
      .from('guide_savings_goals')
      .select('id, guide_id')
      .eq('id', goalId)
      .eq('guide_id', user.id)
      .single();

    if (checkError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Delete goal
    const { error: deleteError } = await client
      .from('guide_savings_goals')
      .delete()
      .eq('id', goalId)
      .eq('guide_id', user.id);

    if (deleteError) {
      logger.error('Failed to delete savings goal', deleteError, { guideId: user.id, goalId });
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete savings goal', error, { guideId: user.id, goalId });
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
});

