/**
 * API: Guide Reward Catalog
 * GET  /api/guide/rewards/catalog - Browse reward catalog
 * POST /api/guide/rewards/catalog - Create reward (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createRewardSchema = z.object({
  reward_type: z.enum(['cashback', 'voucher', 'merchandise', 'benefit', 'discount']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  points_cost: z.number().int().positive(),
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

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const rewardType = searchParams.get('type');
  const minPoints = searchParams.get('min_points');
  const maxPoints = searchParams.get('max_points');
  const minLevel = searchParams.get('min_level');

  // Get guide level for filtering
  const client = supabase as unknown as any;
  let guideLevel: string | null = null;

  if (user) {
    const { data: guideStats } = await client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .not('check_in_at', 'is', null)
      .not('check_out_at', 'is', null);

    const tripCount = guideStats?.length || 0;

    // Calculate level
    if (tripCount >= 100) guideLevel = 'diamond';
    else if (tripCount >= 50) guideLevel = 'platinum';
    else if (tripCount >= 25) guideLevel = 'gold';
    else if (tripCount >= 10) guideLevel = 'silver';
    else guideLevel = 'bronze';
  }

  // Build query
  let query = client
    .from('guide_reward_catalog')
    .select('*')
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  // Filter by type
  if (rewardType) {
    query = query.eq('reward_type', rewardType);
  }

  // Filter by points range
  if (minPoints) {
    query = query.gte('points_cost', parseInt(minPoints, 10));
  }
  if (maxPoints) {
    query = query.lte('points_cost', parseInt(maxPoints, 10));
  }

  // Filter by level (only show rewards available for guide's level)
  if (guideLevel) {
    // Level order: bronze=1, silver=2, gold=3, platinum=4, diamond=5
    const levelOrder: Record<string, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    };
    const guideLevelOrder = levelOrder[guideLevel] || 0;

    // Only show rewards where min_level is null or guide level >= min_level
    // This is handled by checking availability function in UI
  }

  const { data: rewards, error } = await query;

  if (error) {
    logger.error('Failed to fetch reward catalog', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch catalog' },
      { status: 500 }
    );
  }

  // Filter by availability (date, stock, level)
  const availableRewards = (rewards || []).filter((reward: any) => {
    // Check date availability
    const now = new Date();
    if (reward.available_from && new Date(reward.available_from) > now) {
      return false;
    }
    if (reward.available_until && new Date(reward.available_until) < now) {
      return false;
    }

    // Check stock
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return false;
    }

    // Check level requirement
    if (reward.min_level && guideLevel) {
      const levelOrder: Record<string, number> = {
        bronze: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
        diamond: 5,
      };
      const minLevelOrder = levelOrder[reward.min_level] || 0;
      const guideLevelOrder = levelOrder[guideLevel] || 0;
      if (guideLevelOrder < minLevelOrder) {
        return false;
      }
    }

    return true;
  });

  logger.info('Reward catalog fetched', {
    userId: user.id,
    count: availableRewards.length,
  });

  return NextResponse.json({
    rewards: availableRewards,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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

  // Parse and validate request body
  const body = await request.json();
  const validated = createRewardSchema.parse(body);

  const client = supabase as unknown as any;

  // Insert reward
  const { data: reward, error } = await client
    .from('guide_reward_catalog')
    .insert({
      ...validated,
      available_from: validated.available_from
        ? new Date(validated.available_from).toISOString()
        : new Date().toISOString(),
      available_until: validated.available_until
        ? new Date(validated.available_until).toISOString()
        : null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create reward', error, {
      adminId: user.id,
      validated,
    });
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }

  logger.info('Reward created', {
    rewardId: reward.id,
    adminId: user.id,
  });

  return NextResponse.json({
    success: true,
    reward,
  });
});

