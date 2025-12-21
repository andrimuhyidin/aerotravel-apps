/**
 * API: Guide Reward Points
 * GET /api/guide/rewards/points - Get current points balance and summary
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import {
  getExpiringPoints,
  getPointsBalance,
  notifyPointsExpiring,
} from '@/lib/guide/reward-points';
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

  // Get points balance
  const balance = await getPointsBalance(user.id);

  if (!balance) {
    return NextResponse.json(
      { error: 'Failed to fetch points balance' },
      { status: 500 }
    );
  }

  // Get expiring points (next 30 days)
  const expiringPoints = await getExpiringPoints(user.id, 30);

  // Calculate total expiring
  const totalExpiring = expiringPoints.reduce((sum, item) => sum + item.points, 0);

  // Create notification if points are expiring
  if (totalExpiring > 0) {
    await notifyPointsExpiring(user.id, totalExpiring, 30).catch((error) => {
      logger.warn('Failed to create expiring points notification', {
        error,
        userId: user.id,
        totalExpiring,
      });
    });
  }

  logger.info('Points balance fetched', {
    userId: user.id,
    balance: balance.balance,
  });

  return NextResponse.json({
    balance: balance.balance,
    lifetimeEarned: balance.lifetimeEarned,
    lifetimeRedeemed: balance.lifetimeRedeemed,
    expiredPoints: balance.expiredPoints,
    expiringSoon: {
      total: totalExpiring,
      details: expiringPoints,
      warningDays: 30,
    },
  });
});

