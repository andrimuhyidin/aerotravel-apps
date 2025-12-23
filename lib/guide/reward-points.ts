/**
 * Reward Points Utilities
 * Functions for calculating and managing reward points
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type RewardSourceType =
  | 'challenge'
  | 'badge'
  | 'performance'
  | 'level_up'
  | 'milestone'
  | 'special'
  | 'manual'
  | 'adjustment';

export type RewardTransactionType =
  | 'earn'
  | 'redeem'
  | 'expire'
  | 'adjustment'
  | 'refund';

/**
 * Award points to a guide
 */
export async function awardPoints(
  guideId: string,
  points: number,
  sourceType: RewardSourceType,
  sourceId?: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    if (points <= 0) {
      logger.warn('Invalid points amount', { guideId, points });
      return null;
    }

    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Call database function
    const { data, error } = await client.rpc('award_reward_points', {
      p_guide_id: guideId,
      p_points: points,
      p_source_type: sourceType,
      p_source_id: sourceId || null,
      p_description: description || null,
      p_metadata: metadata ? (metadata as unknown) : null,
    });

    if (error) {
      logger.error('Failed to award points', error, {
        guideId,
        points,
        sourceType,
        sourceId,
      });
      return null;
    }

    logger.info('Points awarded', {
      guideId,
      points,
      sourceType,
      transactionId: data,
    });

    // Create notification for points earned
    await notifyPointsEarned(
      guideId,
      points,
      sourceType,
      description || `Anda memperoleh ${points} poin reward`
    );

    return data;
  } catch (error) {
    logger.error('Exception awarding points', error, {
      guideId,
      points,
      sourceType,
    });
    return null;
  }
}

/**
 * Redeem points from a guide
 */
export async function redeemPoints(
  guideId: string,
  points: number,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    if (points <= 0) {
      logger.warn('Invalid points amount for redemption', { guideId, points });
      return null;
    }

    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Call database function
    const { data, error } = await client.rpc('redeem_reward_points', {
      p_guide_id: guideId,
      p_points: points,
      p_description: description || null,
      p_metadata: metadata ? (metadata as unknown) : null,
    });

    if (error) {
      logger.error('Failed to redeem points', error, {
        guideId,
        points,
      });
      return null;
    }

    logger.info('Points redeemed', {
      guideId,
      points,
      transactionId: data,
    });

    return data;
  } catch (error) {
    logger.error('Exception redeeming points', error, {
      guideId,
      points,
    });
    return null;
  }
}

/**
 * Get points balance for a guide
 */
export async function getPointsBalance(guideId: string): Promise<{
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiredPoints: number;
} | null> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    const { data, error } = await client
      .from('guide_reward_points')
      .select('balance, lifetime_earned, lifetime_redeemed, expired_points')
      .eq('guide_id', guideId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return zero balance
        return {
          balance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          expiredPoints: 0,
        };
      }
      logger.error('Failed to get points balance', error, { guideId });
      return null;
    }

    return {
      balance: data.balance || 0,
      lifetimeEarned: data.lifetime_earned || 0,
      lifetimeRedeemed: data.lifetime_redeemed || 0,
      expiredPoints: data.expired_points || 0,
    };
  } catch (error) {
    logger.error('Exception getting points balance', error, { guideId });
    return null;
  }
}

/**
 * Calculate points for challenge completion
 */
export function calculateChallengePoints(
  challengeType: string,
  targetValue: number
): number {
  switch (challengeType) {
    case 'trip_count':
      return Math.min(500, Math.floor(targetValue / 10) * 100); // 100 points per 10 trips, max 500
    case 'rating':
      return targetValue >= 5.0 ? 200 : 100; // 200 for perfect, 100 for high
    case 'earnings':
      return Math.floor(targetValue / 1000); // 1 point per Rp 1,000
    case 'perfect_month':
      return 1000; // Bonus for perfect month
    default:
      return 100; // Default for custom challenges
  }
}

/**
 * Calculate points for badge earned
 */
export function calculateBadgePoints(badgeId: string): number {
  const badgePoints: Record<string, number> = {
    // Common badges
    first_trip: 50,
    rookie: 50,
    // Uncommon badges
    experienced: 100,
    excellent_service: 100,
    // Rare badges
    expert: 150,
    five_star: 150,
    // Epic badges
    master: 200,
    zero_complaints: 200,
    clean_record: 200,
  };

  return badgePoints[badgeId] || 50; // Default 50 points
}

/**
 * Calculate points for level up
 */
export function calculateLevelUpPoints(
  fromLevel: string,
  toLevel: string
): number {
  const levelPoints: Record<string, number> = {
    'bronze-silver': 200,
    'silver-gold': 300,
    'gold-platinum': 500,
    'platinum-diamond': 1000,
  };

  const key = `${fromLevel}-${toLevel}`;
  return levelPoints[key] || 0;
}

/**
 * Calculate points for performance bonus
 * 10% of bonus amount in points
 */
export function calculatePerformanceBonusPoints(bonusAmount: number): number {
  return Math.floor(bonusAmount * 0.1);
}

/**
 * Calculate points for wallet milestone
 */
export function calculateMilestonePoints(milestoneType: string): number {
  const milestonePoints: Record<string, number> = {
    first_million: 500,
    five_million: 1000,
    ten_million: 2000,
  };

  return milestonePoints[milestoneType] || 0;
}

/**
 * Get expiring points (points expiring in next N days)
 */
export async function getExpiringPoints(
  guideId: string,
  days: number = 30
): Promise<Array<{ points: number; expiresAt: string }>> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const { data, error } = await client
      .from('guide_reward_transactions')
      .select('points, expires_at')
      .eq('guide_id', guideId)
      .eq('transaction_type', 'earn')
      .not('expires_at', 'is', null)
      .lte('expires_at', expiryDate.toISOString())
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      logger.error('Failed to get expiring points', error, { guideId, days });
      return [];
    }

    // Group by expiration date and sum points
    const grouped = (data || []).reduce(
      (
        acc: Record<string, number>,
        item: {
          points: number | unknown;
          expires_at: string | null | undefined;
        }
      ) => {
        if (!item.expires_at) return acc;
        const dateParts = item.expires_at.split('T');
        const date = dateParts[0];
        if (!date) return acc;
        const pointsValue = typeof item.points === 'number' ? item.points : 0;
        acc[date] = (acc[date] || 0) + pointsValue;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped).map(([expiresAt, points]) => ({
      points: points as number,
      expiresAt,
    }));
  } catch (error) {
    logger.error('Exception getting expiring points', error, { guideId, days });
    return [];
  }
}

/**
 * Create notification for points earned
 * This is a helper function that can be called after awarding points
 */
export async function notifyPointsEarned(
  guideId: string,
  points: number,
  source: string,
  description?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Create notification (using notification_logs table)
    await client.from('notification_logs').insert({
      user_id: guideId,
      channel: 'push',
      subject: 'Poin Reward Diperoleh!',
      body:
        description ||
        `Anda memperoleh ${points.toLocaleString('id-ID')} poin reward dari ${source}`,
      status: 'pending',
      entity_type: 'reward_points',
      metadata: {
        points,
        source,
        description,
      },
    });
  } catch (error) {
    // Don't fail if notification creation fails
    logger.warn('Failed to create points earned notification', {
      error,
      guideId,
      points,
      source,
    });
  }
}

/**
 * Create notification for points expiring
 */
export async function notifyPointsExpiring(
  guideId: string,
  totalExpiring: number,
  daysUntilExpiry: number
): Promise<void> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Check if notification already exists for this expiry period
    const { data: existing } = await client
      .from('notification_logs')
      .select('id')
      .eq('user_id', guideId)
      .eq('entity_type', 'reward_points_expiring')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // Update existing notification
      await client
        .from('notification_logs')
        .update({
          body: `Anda memiliki ${totalExpiring.toLocaleString('id-ID')} poin yang akan kadaluarsa dalam ${daysUntilExpiry} hari. Tukar sekarang!`,
          metadata: {
            totalExpiring,
            daysUntilExpiry,
          },
        })
        .eq('id', existing.id);
    } else {
      // Create new notification
      await client.from('notification_logs').insert({
        user_id: guideId,
        channel: 'push',
        subject: 'Poin Akan Kadaluarsa!',
        body: `Anda memiliki ${totalExpiring.toLocaleString('id-ID')} poin yang akan kadaluarsa dalam ${daysUntilExpiry} hari. Tukar sekarang!`,
        status: 'pending',
        entity_type: 'reward_points_expiring',
        metadata: {
          totalExpiring,
          daysUntilExpiry,
        },
      });
    }
  } catch (error) {
    // Don't fail if notification creation fails
    logger.warn('Failed to create points expiring notification', {
      error,
      guideId,
      totalExpiring,
      daysUntilExpiry,
    });
  }
}
