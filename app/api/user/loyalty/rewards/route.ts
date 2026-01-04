/**
 * Loyalty Rewards Catalog API
 * GET /api/user/loyalty/rewards - Get available rewards catalog
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { getActiveRewards } from '@/lib/cms/rewards';
import { logger } from '@/lib/utils/logger';

type RewardCategory = 'voucher' | 'discount' | 'merchandise' | 'experience';

type Reward = {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  valueInRupiah: number;
  imageUrl: string | null;
  isAvailable: boolean;
  stock: number | null;
  validUntil: string | null;
  terms: string[];
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/user/loyalty/rewards');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's current points balance
  let userBalance = 0;
  if (user) {
    const { data: balanceData } = await supabase
      .from('loyalty_points')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    userBalance = balanceData?.balance || 0;
  }

  // Get rewards from database
  const dbRewards = await getActiveRewards();

  // Transform database rewards to API format
  const rewards: Reward[] = dbRewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    description: reward.description || '',
    category: (reward.category as RewardCategory) || 'voucher',
    pointsCost: reward.points_cost,
    valueInRupiah: reward.value_in_rupiah || 0,
    imageUrl: reward.image_url,
    isAvailable: reward.is_active && (reward.stock === null || reward.stock > 0),
    stock: reward.stock,
    validUntil: reward.valid_until,
    terms: Array.isArray(reward.terms) ? reward.terms : [],
  }));

  // Get query params for filtering
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as RewardCategory | null;

  // Filter rewards by category if provided
  let filteredRewards = rewards;
  if (category) {
    filteredRewards = rewards.filter((r) => r.category === category);
  }

  // Sort by points cost ascending
  filteredRewards.sort((a, b) => a.pointsCost - b.pointsCost);

  // Add canRedeem flag based on user balance
  const rewardsWithRedeemability = filteredRewards.map((reward) => ({
    ...reward,
    canRedeem: userBalance >= reward.pointsCost && reward.isAvailable,
    pointsShortfall:
      userBalance < reward.pointsCost ? reward.pointsCost - userBalance : 0,
  }));

  return NextResponse.json({
    rewards: rewardsWithRedeemability,
    userBalance,
    categories: [
      { id: 'voucher', name: 'Voucher', count: rewards.filter((r) => r.category === 'voucher').length },
      { id: 'discount', name: 'Diskon', count: rewards.filter((r) => r.category === 'discount').length },
      { id: 'merchandise', name: 'Merchandise', count: rewards.filter((r) => r.category === 'merchandise').length },
      { id: 'experience', name: 'Experience', count: rewards.filter((r) => r.category === 'experience').length },
    ],
  });
});

