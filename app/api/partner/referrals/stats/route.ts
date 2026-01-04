/**
 * API: Partner Referral Stats
 * GET /api/partner/referrals/stats - Get partner's referral statistics
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 10, nextAt: 10 },
  silver: { min: 10, max: 25, nextAt: 25 },
  gold: { min: 25, max: 50, nextAt: 50 },
  platinum: { min: 50, max: Infinity, nextAt: 0 },
};

function calculateTier(completedReferrals: number): { tier: 'bronze' | 'silver' | 'gold' | 'platinum'; nextAt: number } {
  if (completedReferrals >= 50) return { tier: 'platinum', nextAt: 0 };
  if (completedReferrals >= 25) return { tier: 'gold', nextAt: 50 };
  if (completedReferrals >= 10) return { tier: 'silver', nextAt: 25 };
  return { tier: 'bronze', nextAt: 10 };
}

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    // Get partner's referral code
    const { data: partnerProfile } = await client
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Generate referral code if not exists
    let referralCode = partnerProfile?.referral_code;
    if (!referralCode) {
      referralCode = `PARTNER-${user.id.slice(0, 6).toUpperCase()}`;
      await client
        .from('users')
        .update({ referral_code: referralCode })
        .eq('id', user.id);
    }

    // Get referral counts by status
    const { data: referralCounts, error: countsError } = await client
      .from('referrals')
      .select('status')
      .eq('referrer_id', user.id);

    if (countsError) {
      logger.error('Failed to fetch referral counts', countsError, { userId: user.id });
    }

    const statusCounts = (referralCounts || []).reduce((acc: Record<string, number>, r: { status: string }) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const totalReferrals = referralCounts?.length || 0;
    const completedReferrals = statusCounts['completed'] || 0;
    const pendingReferrals = statusCounts['pending'] || 0;
    const expiredReferrals = statusCounts['expired'] || 0;

    // Calculate total earnings from completed referrals
    const { data: earnings } = await client
      .from('referrals')
      .select('referrer_points')
      .eq('referrer_id', user.id)
      .eq('status', 'completed');

    const totalEarnings = (earnings || []).reduce(
      (sum: number, r: { referrer_points: number }) => sum + (r.referrer_points || 0),
      0
    );

    // Calculate pending earnings
    const { data: pendingEarningsData } = await client
      .from('referrals')
      .select('referrer_points')
      .eq('referrer_id', user.id)
      .eq('status', 'pending');

    const pendingEarningsTotal = (pendingEarningsData || []).reduce(
      (sum: number, r: { referrer_points: number }) => sum + (r.referrer_points || 0),
      0
    );

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0 
      ? (completedReferrals / totalReferrals) * 100 
      : 0;

    // Calculate tier
    const { tier, nextAt } = calculateTier(completedReferrals);

    return NextResponse.json({
      referralCode,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      expiredReferrals,
      totalEarnings,
      pendingEarnings: pendingEarningsTotal,
      conversionRate,
      tier,
      nextTierAt: nextAt,
    });
  } catch (error) {
    logger.error('Failed to fetch referral stats', error, { userId: user.id });
    throw error;
  }
});

