/**
 * Partner Reward Points Service
 * Handle reward points operations for partner agents
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type {
  RewardSourceType,
  MilestoneType,
} from './reward-rules';

export type RewardPointsBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiredPoints: number;
};

export type RewardTransaction = {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
  points: number;
  sourceType?: RewardSourceType;
  sourceId?: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  expiresAt?: string;
  createdAt: string;
};

export type Milestone = {
  id: string;
  type: MilestoneType;
  milestoneValue: number;
  pointsAwarded: number;
  achievedAt: string;
};

/**
 * Get partner reward points balance
 */
export async function getPointsBalance(partnerId: string): Promise<RewardPointsBalance | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('partner_reward_points')
    .select('balance, lifetime_earned, lifetime_redeemed, expired_points')
    .eq('partner_id', partnerId)
    .single();

  if (error) {
    logger.error('Failed to get reward points balance', error);
    return null;
  }

  return {
    balance: data.balance || 0,
    lifetimeEarned: data.lifetime_earned || 0,
    lifetimeRedeemed: data.lifetime_redeemed || 0,
    expiredPoints: data.expired_points || 0,
  };
}

/**
 * Award points to partner
 */
export async function awardPoints(
  partnerId: string,
  points: number,
  sourceType: RewardSourceType,
  sourceId?: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    if (points <= 0) {
      logger.warn('Invalid points amount', { partnerId, points });
      return null;
    }

    const supabase = createClient();
    const client = supabase as unknown as any;

    // Call database function
    const { data, error } = await client.rpc('award_partner_points', {
      p_partner_id: partnerId,
      p_points: points,
      p_source_type: sourceType,
      p_source_id: sourceId || null,
      p_description: description || null,
      p_metadata: metadata ? (metadata as unknown) : null,
    });

    if (error) {
      logger.error('Failed to award points', error, {
        partnerId,
        points,
        sourceType,
        sourceId,
      });
      return null;
    }

    logger.info('Points awarded', {
      partnerId,
      points,
      sourceType,
      transactionId: data,
    });

    return data;
  } catch (error) {
    logger.error('Exception awarding points', error, {
      partnerId,
      points,
      sourceType,
    });
    return null;
  }
}

/**
 * Redeem points
 */
export async function redeemPoints(
  partnerId: string,
  points: number,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    if (points <= 0) {
      logger.warn('Invalid points amount for redemption', { partnerId, points });
      return null;
    }

    const supabase = createClient();
    const client = supabase as unknown as any;

    // Call database function
    const { data, error } = await client.rpc('redeem_partner_points', {
      p_partner_id: partnerId,
      p_points: points,
      p_description: description || null,
      p_metadata: metadata ? (metadata as unknown) : null,
    });

    if (error) {
      logger.error('Failed to redeem points', error, {
        partnerId,
        points,
      });
      return null;
    }

    logger.info('Points redeemed', {
      partnerId,
      points,
      transactionId: data,
    });

    return data;
  } catch (error) {
    logger.error('Exception redeeming points', error, {
      partnerId,
      points,
    });
    return null;
  }
}

/**
 * Get reward points transaction history
 */
export async function getPointsHistory(
  partnerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<RewardTransaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('partner_reward_transactions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to get points history', error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    type: t.transaction_type,
    points: t.points,
    sourceType: t.source_type,
    sourceId: t.source_id,
    balanceBefore: t.balance_before,
    balanceAfter: t.balance_after,
    description: t.description,
    expiresAt: t.expires_at,
    createdAt: t.created_at,
  }));
}

/**
 * Get partner milestones
 */
export async function getMilestones(partnerId: string): Promise<Milestone[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('partner_reward_milestones')
    .select('*')
    .eq('partner_id', partnerId)
    .order('achieved_at', { ascending: false });

  if (error) {
    logger.error('Failed to get milestones', error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    type: m.milestone_type as MilestoneType,
    milestoneValue: m.milestone_value,
    pointsAwarded: m.points_awarded,
    achievedAt: m.achieved_at,
  }));
}

/**
 * Check and award milestone if achieved
 */
export async function checkAndAwardMilestone(
  partnerId: string,
  milestoneType: MilestoneType,
  currentValue: number
): Promise<boolean> {
  try {
    const { getMilestoneConfig } = await import('./reward-rules');
    const config = getMilestoneConfig(milestoneType);

    if (!config) {
      logger.warn('Milestone config not found', { milestoneType });
      return false;
    }

    // Check if already achieved
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('partner_reward_milestones')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('milestone_type', milestoneType)
      .maybeSingle();

    if (existing) {
      return false; // Already achieved
    }

    // Check if milestone is achieved
    if (currentValue >= config.value) {
      // Award points
      const transactionId = await awardPoints(
        partnerId,
        config.points,
        'earn_milestone',
        undefined,
        `Milestone: ${config.description}`,
        { milestoneType, milestoneValue: config.value }
      );

      if (transactionId) {
        // Record milestone
        await supabase.from('partner_reward_milestones').insert({
          partner_id: partnerId,
          milestone_type: milestoneType,
          milestone_value: config.value,
          points_awarded: config.points,
          metadata: { transactionId },
        });

        logger.info('Milestone achieved', {
          partnerId,
          milestoneType,
          points: config.points,
        });

        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('Failed to check milestone', error, {
      partnerId,
      milestoneType,
    });
    return false;
  }
}

