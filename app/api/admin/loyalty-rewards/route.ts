/**
 * API: Loyalty Rewards Management (Admin)
 * GET /api/admin/loyalty-rewards - List all rewards
 * POST /api/admin/loyalty-rewards - Create new reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createRewardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  points_cost: z.number().int().positive(),
  value_in_rupiah: z.number().int().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  stock: z.number().int().positive().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  terms: z.array(z.string()).optional().default([]),
  display_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: rewards, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch loyalty rewards', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }

  return NextResponse.json({ rewards });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create rewards
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createRewardSchema.parse(await request.json());

  const { data: reward, error } = await supabase
    .from('loyalty_rewards')
    .insert({
      ...body,
      terms: body.terms || [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create loyalty reward', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }

  logger.info('Loyalty reward created', { id: reward.id });
  return NextResponse.json({ reward }, { status: 201 });
});

