/**
 * API: Admin - Manual Reward Points Expiration
 * POST /api/admin/rewards/expire - Manually trigger points expiration (for testing/admin)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is admin
  const isAuthorized = await hasRole(['super_admin', 'ops_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Call database function to expire points
    const { data, error } = await client.rpc('expire_reward_points');

    if (error) {
      logger.error('Failed to expire reward points', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to expire reward points', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Reward points expiration triggered', {
      userId: user.id,
      expiredCount: data,
    });

    return NextResponse.json({
      success: true,
      expiredCount: data || 0,
      message: `Successfully expired points. ${data || 0} transactions processed.`,
    });
  } catch (error) {
    logger.error('Exception expiring reward points', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to expire reward points' },
      { status: 500 }
    );
  }
});

