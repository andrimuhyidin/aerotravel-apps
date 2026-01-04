/**
 * API: Guide Reward Redemptions
 * GET /api/guide/rewards/redemptions - Get redemption history
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const status = searchParams.get('status'); // pending, processing, completed, etc.

  // Build query
  let query = client
    .from('guide_reward_redemptions')
    .select(
      `
      *,
      guide_reward_catalog (
        id,
        reward_type,
        title,
        description,
        image_url
      )
    `
    )
    .eq('guide_id', user.id)
    .order('redeemed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }

  const { data: redemptions, error } = await query;

  if (error) {
    logger.error('Failed to fetch redemptions', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
      { status: 500 }
    );
  }

  logger.info('Redemptions fetched', {
    userId: user.id,
    count: redemptions?.length || 0,
  });

  return NextResponse.json({
    redemptions: redemptions || [],
    pagination: {
      limit,
      offset,
      total: redemptions?.length || 0,
    },
  });
});

