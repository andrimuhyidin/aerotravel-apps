/**
 * API: Loyalty Reward Management by ID (Admin)
 * GET /api/admin/loyalty-rewards/[id] - Get single reward
 * PUT /api/admin/loyalty-rewards/[id] - Update reward
 * DELETE /api/admin/loyalty-rewards/[id] - Delete reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateRewardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  points_cost: z.number().int().positive().optional(),
  value_in_rupiah: z.number().int().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  stock: z.number().int().positive().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  terms: z.array(z.string()).optional(),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: reward, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Failed to fetch reward: ${id}`, error);
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
  }

  return NextResponse.json({ reward });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update rewards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateRewardSchema.parse(await request.json());

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  if (body.terms !== undefined) {
    updateData.terms = body.terms;
  }

  const { data: reward, error } = await supabase
    .from('loyalty_rewards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update reward: ${id}`, error);
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
  }

  logger.info(`Reward updated: ${id}`);
  return NextResponse.json({ reward });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete rewards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('loyalty_rewards')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Failed to delete reward: ${id}`, error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }

  logger.info(`Reward deleted: ${id}`);
  return NextResponse.json({ message: 'Reward deleted successfully' });
});

