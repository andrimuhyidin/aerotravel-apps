/**
 * Loyalty Rewards Library
 * Functions to fetch loyalty rewards from database
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  points_cost: number;
  value_in_rupiah: number | null;
  image_url: string | null;
  stock: number | null;
  valid_until: string | null;
  terms: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active rewards
 */
export async function getActiveRewards(): Promise<LoyaltyReward[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.warn('Error fetching loyalty rewards', error);
      return [];
    }

    // Parse terms JSONB to array
    const rewards = (data || []).map((reward) => ({
      ...reward,
      terms: Array.isArray(reward.terms) ? reward.terms : [],
    })) as LoyaltyReward[];

    return rewards;
  } catch (error) {
    logger.error('Error fetching loyalty rewards', error);
    return [];
  }
}

/**
 * Get a single reward by ID
 */
export async function getRewardById(id: string): Promise<LoyaltyReward | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.warn(`Reward not found: ${id}`, error);
      return null;
    }

    return {
      ...data,
      terms: Array.isArray(data.terms) ? data.terms : [],
    } as LoyaltyReward;
  } catch (error) {
    logger.error(`Error fetching reward: ${id}`, error);
    return null;
  }
}

