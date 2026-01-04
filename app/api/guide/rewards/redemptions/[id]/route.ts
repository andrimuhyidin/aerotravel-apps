/**
 * API: Guide Reward Redemption Details
 * GET  /api/guide/rewards/redemptions/[id] - Get redemption details
 * POST /api/guide/rewards/redemptions/[id]/cancel - Cancel redemption
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { cancelRedemption } from '@/lib/guide/reward-redemption';
import { logger } from '@/lib/utils/logger';

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

  // Get redemption details with catalog info
  const { data: redemption, error } = await client
    .from('guide_reward_redemptions')
    .select(
      `
      *,
      guide_reward_catalog (
        id,
        reward_type,
        title,
        description,
        image_url,
        points_cost
      )
    `
    )
    .eq('id', id)
    .eq('guide_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
    }
    logger.error('Failed to fetch redemption', error, {
      userId: user.id,
      redemptionId: id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch redemption' },
      { status: 500 }
    );
  }

  return NextResponse.json({ redemption });
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = supabase as unknown as any;

  // Check if redemption exists and belongs to user
  const { data: redemption, error: redemptionError } = await client
    .from('guide_reward_redemptions')
    .select('status')
    .eq('id', id)
    .eq('guide_id', user.id)
    .single();

  if (redemptionError || !redemption) {
    return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
  }

  // Only allow cancellation if status is pending
  if (redemption.status !== 'pending') {
    return NextResponse.json(
      { error: 'Only pending redemptions can be cancelled' },
      { status: 400 }
    );
  }

  // Parse cancellation reason
  const body = await request.json().catch(() => ({}));
  const reason = body.reason || 'Cancelled by user';

  // Cancel redemption
  const cancelled = await cancelRedemption(id, reason);

  if (!cancelled) {
    return NextResponse.json(
      { error: 'Failed to cancel redemption' },
      { status: 500 }
    );
  }

  logger.info('Redemption cancelled', {
    redemptionId: id,
    userId: user.id,
    reason,
  });

  return NextResponse.json({
    success: true,
    message: 'Redemption cancelled successfully. Points have been refunded.',
  });
}

