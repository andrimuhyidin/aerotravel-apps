/**
 * API: Get Referral Statistics
 * GET /api/user/referral/stats
 *
 * Returns the user's referral statistics including all referrals
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getReferralStats } from '@/lib/customers/referral';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getReferralStats(user.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to get referral stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: stats.code,
      totalReferrals: stats.totalReferrals,
      successfulReferrals: stats.successfulReferrals,
      pendingReferrals: stats.pendingReferrals,
      totalPointsEarned: stats.totalPointsEarned,
      totalPointsValue: stats.totalPointsEarned, // 1 point = Rp 1
      referrals: stats.referrals.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        pointsEarned: r.pointsEarned,
      })),
    });
  } catch (error) {
    logger.error('Failed to get referral stats', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get referral stats' },
      { status: 500 }
    );
  }
});

