/**
 * API: Guide Reward Catalog Item
 * GET    /api/guide/rewards/catalog/[id] - Get reward details
 * PATCH  /api/guide/rewards/catalog/[id] - Update reward (admin only)
 * DELETE /api/guide/rewards/catalog/[id] - Delete reward (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateRewardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  points_cost: z.number().int().positive().optional(),
  cash_value: z.number().optional(),
  voucher_code_template: z.string().optional(),
  voucher_provider: z.string().optional(),
  merchandise_name: z.string().optional(),
  merchandise_sku: z.string().optional(),
  benefit_description: z.string().optional(),
  benefit_code: z.string().optional(),
  discount_percentage: z.number().int().min(0).max(100).optional(),
  discount_max_amount: z.number().optional(),
  discount_code_template: z.string().optional(),
  stock_quantity: z.number().int().positive().optional().nullable(),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  min_level: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).optional().nullable(),
  is_active: z.boolean().optional(),
  image_url: z.string().url().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
});

export const GET = withErrorHandler(async (
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

  const { id } = await params;
  const client = supabase as unknown as any;

  // Get reward details
  const { data: reward, error } = await client
    .from('guide_reward_catalog')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    logger.error('Failed to fetch reward', error, {
      userId: user.id,
      rewardId: id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch reward' },
      { status: 500 }
    );
  }

  // Check if reward is active and available
  if (!reward.is_active) {
    return NextResponse.json({ error: 'Reward not available' }, { status: 404 });
  }

  return NextResponse.json({ reward });
});

export const PATCH = withErrorHandler(async (
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

  // Check admin role
  const isAdmin = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Parse and validate request body
  const body = await request.json();
  const validated = updateRewardSchema.parse(body);

  const client = supabase as unknown as any;

  // Prepare update data
  const updateData: Record<string, unknown> = { ...validated };
  if (validated.available_from) {
    updateData.available_from = new Date(validated.available_from).toISOString();
  }
  if (validated.available_until !== undefined) {
    updateData.available_until = validated.available_until
      ? new Date(validated.available_until).toISOString()
      : null;
  }

  // Update reward
  const { data: reward, error } = await client
    .from('guide_reward_catalog')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update reward', error, {
      adminId: user.id,
      rewardId: id,
      updateData,
    });
    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    );
  }

  logger.info('Reward updated', {
    rewardId: id,
    adminId: user.id,
  });

  return NextResponse.json({
    success: true,
    reward,
  });
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

  // Check admin role
  const isAdmin = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const client = supabase as unknown as any;

  // Delete reward (soft delete by setting is_active = false)
  const { error } = await client
    .from('guide_reward_catalog')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete reward', error, {
      adminId: user.id,
      rewardId: id,
    });
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    );
  }

  logger.info('Reward deleted', {
    rewardId: id,
    adminId: user.id,
  });

  return NextResponse.json({
    success: true,
  });
});

