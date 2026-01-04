/**
 * GET /api/partner/settings/rewards
 * Returns partner reward settings for client-side usage
 */

import { NextResponse } from 'next/server';

import { getSetting } from '@/lib/settings';
import { logger } from '@/lib/utils/logger';

const DEFAULT_REFERRAL_POINTS = 1000;
const DEFAULT_POINTS_PER_10K = 1;
const DEFAULT_MIN_REDEMPTION_POINTS = 100;
const DEFAULT_POINTS_EXPIRATION_MONTHS = 12;

export async function GET() {
  try {
    const [
      referralPoints,
      pointsPer10k,
      minRedemptionPoints,
      pointsExpirationMonths,
      milestoneConfigs,
    ] = await Promise.all([
      getSetting('partner_rewards.referral_points'),
      getSetting('partner_rewards.points_per_10k'),
      getSetting('partner_rewards.min_redemption_points'),
      getSetting('partner_rewards.points_expiration_months'),
      getSetting('partner_rewards.milestone_configs'),
    ]);

    return NextResponse.json({
      referralPoints: (referralPoints as number) ?? DEFAULT_REFERRAL_POINTS,
      pointsPer10k: (pointsPer10k as number) ?? DEFAULT_POINTS_PER_10K,
      minRedemptionPoints: (minRedemptionPoints as number) ?? DEFAULT_MIN_REDEMPTION_POINTS,
      pointsExpirationMonths: (pointsExpirationMonths as number) ?? DEFAULT_POINTS_EXPIRATION_MONTHS,
      milestoneConfigs: milestoneConfigs ?? null,
    });
  } catch (error) {
    logger.error('Failed to fetch partner reward settings', error);
    
    // Return defaults on error
    return NextResponse.json({
      referralPoints: DEFAULT_REFERRAL_POINTS,
      pointsPer10k: DEFAULT_POINTS_PER_10K,
      minRedemptionPoints: DEFAULT_MIN_REDEMPTION_POINTS,
      pointsExpirationMonths: DEFAULT_POINTS_EXPIRATION_MONTHS,
      milestoneConfigs: null,
    });
  }
}

