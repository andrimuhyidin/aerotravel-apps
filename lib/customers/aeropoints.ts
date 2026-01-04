/**
 * Customer AeroPoints System
 * Loyalty points system for B2C customers
 * Based on PRD 5.3.B - Loyalty System (AeroPoints & Referral)
 *
 * Points Rules:
 * - Earn: Setiap transaksi kelipatan Rp 100.000 mendapatkan 10 Poin
 * - Burn: 1 Poin = Rp 1 (dapat digunakan sebagai potongan harga)
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Points transaction types matching database enum
 */
export type PointsTransactionType =
  | 'earn_booking'
  | 'earn_referral'
  | 'earn_review'
  | 'redeem'
  | 'expire'
  | 'adjustment';

/**
 * Points balance info
 */
export type PointsBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
};

/**
 * Transaction history item
 */
export type PointsTransaction = {
  id: string;
  transactionType: PointsTransactionType;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string | null;
  referralCode: string | null;
  description: string | null;
  createdAt: string;
};

/**
 * Points calculation constants
 * These are defaults - actual values come from settings
 */
const DEFAULT_POINTS_PER_100K = 10; // 10 points per Rp 100,000
const DEFAULT_POINTS_REDEMPTION_VALUE = 1; // 1 point = Rp 1
const DEFAULT_REVIEW_BONUS_POINTS = 50; // Bonus points for leaving a review
const DEFAULT_MIN_BOOKING_FOR_POINTS = 100000; // Minimum booking value to earn points

/**
 * Get points settings from database
 */
async function getPointsSettings() {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [
      pointsPer100k,
      redemptionValue,
      reviewBonus,
      minBooking,
    ] = await Promise.all([
      getSetting('loyalty.points_per_100k'),
      getSetting('loyalty.redemption_value'),
      getSetting('loyalty.review_bonus'),
      getSetting('loyalty.min_booking_for_points'),
    ]);

    // Fallback to existing settings keys for backward compatibility
    const pointsPer100kFallback = await getSetting('points_per_100k');

    return {
      pointsPer100k:
        (pointsPer100k as number) ||
        (pointsPer100kFallback as number) ||
        DEFAULT_POINTS_PER_100K,
      redemptionValue:
        (redemptionValue as number) || DEFAULT_POINTS_REDEMPTION_VALUE,
      reviewBonus: (reviewBonus as number) || DEFAULT_REVIEW_BONUS_POINTS,
      minBooking: (minBooking as number) || DEFAULT_MIN_BOOKING_FOR_POINTS,
    };
  } catch {
    return {
      pointsPer100k: DEFAULT_POINTS_PER_100K,
      redemptionValue: DEFAULT_POINTS_REDEMPTION_VALUE,
      reviewBonus: DEFAULT_REVIEW_BONUS_POINTS,
      minBooking: DEFAULT_MIN_BOOKING_FOR_POINTS,
    };
  }
}

/**
 * Calculate points earned from booking value
 * Rule: Setiap kelipatan Rp 100.000 = X Poin (from settings)
 */
export async function calculatePointsFromBooking(
  bookingValue: number
): Promise<number> {
  const settings = await getPointsSettings();
  if (bookingValue < settings.minBooking) {
    return 0;
  }
  return Math.floor(bookingValue / 100000) * settings.pointsPer100k;
}

/**
 * Calculate discount amount from points
 * Rule: 1 Point = Rp X (from settings)
 */
export async function calculateDiscountFromPoints(
  points: number
): Promise<number> {
  const settings = await getPointsSettings();
  return points * settings.redemptionValue;
}

/**
 * Calculate points value in Rupiah (for display)
 */
export async function getPointsValue(points: number): Promise<number> {
  const settings = await getPointsSettings();
  return points * settings.redemptionValue;
}

/**
 * Get or create loyalty points record for a user
 */
async function getOrCreateLoyaltyRecord(
  userId: string
): Promise<{ id: string; balance: number } | null> {
  const supabase = await createClient();

  // Try to get existing record
  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing as { id: string; balance: number };
  }

  // Create new record
  const { data: newRecord, error } = await supabase
    .from('loyalty_points')
    .insert({
      user_id: userId,
      balance: 0,
      lifetime_earned: 0,
      lifetime_spent: 0,
    })
    .select('id, balance')
    .single();

  if (error) {
    logger.error('Failed to create loyalty record', error, { userId });
    return null;
  }

  return newRecord as { id: string; balance: number };
}

/**
 * Get customer's points balance
 */
export async function getPointsBalance(
  customerId: string
): Promise<PointsBalance | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('loyalty_points')
    .select('balance, lifetime_earned, lifetime_spent')
    .eq('user_id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, return zero balance
      return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
      };
    }
    logger.error('Failed to get points balance', error, { customerId });
    return null;
  }

  const row = data as {
    balance: number;
    lifetime_earned: number;
    lifetime_spent: number;
  };

  return {
    balance: row.balance,
    lifetimeEarned: row.lifetime_earned,
    lifetimeSpent: row.lifetime_spent,
  };
}

/**
 * Get points transaction history
 */
export async function getPointsHistory(
  customerId: string,
  limit = 20,
  offset = 0
): Promise<PointsTransaction[]> {
  const supabase = await createClient();

  // First get the loyalty record ID
  const { data: loyaltyRecord } = await supabase
    .from('loyalty_points')
    .select('id')
    .eq('user_id', customerId)
    .single();

  if (!loyaltyRecord) {
    return [];
  }

  const loyaltyId = (loyaltyRecord as { id: string }).id;

  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('loyalty_id', loyaltyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to get points history', error, { customerId });
    return [];
  }

  return (data || []).map((row) => {
    const r = row as {
      id: string;
      transaction_type: PointsTransactionType;
      points: number;
      balance_before: number;
      balance_after: number;
      booking_id: string | null;
      referral_code: string | null;
      description: string | null;
      created_at: string;
    };
    return {
      id: r.id,
      transactionType: r.transaction_type,
      points: r.points,
      balanceBefore: r.balance_before,
      balanceAfter: r.balance_after,
      bookingId: r.booking_id,
      referralCode: r.referral_code,
      description: r.description,
      createdAt: r.created_at,
    };
  });
}

/**
 * Award points to a customer
 */
export async function awardPoints(
  customerId: string,
  points: number,
  transactionType: PointsTransactionType,
  bookingId?: string,
  referralCode?: string,
  description?: string
): Promise<string | null> {
  if (points <= 0) {
    return null;
  }

  const supabase = await createClient();

  try {
    // Get or create loyalty record
    const loyaltyRecord = await getOrCreateLoyaltyRecord(customerId);
    if (!loyaltyRecord) {
      return null;
    }

    const balanceBefore = loyaltyRecord.balance;
    const balanceAfter = balanceBefore + points;

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        loyalty_id: loyaltyRecord.id,
        transaction_type: transactionType,
        points,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        booking_id: bookingId || null,
        referral_code: referralCode || null,
        description: description || `Earned ${points} points`,
      })
      .select('id')
      .single();

    if (txError) {
      logger.error('Failed to create points transaction', txError, {
        customerId,
        points,
      });
      return null;
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('loyalty_points')
      .update({
        balance: balanceAfter,
        lifetime_earned: supabase.rpc('increment_value', {
          value: points,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', loyaltyRecord.id);

    // Fallback update if RPC doesn't work
    if (updateError) {
      const { data: current } = await supabase
        .from('loyalty_points')
        .select('lifetime_earned')
        .eq('id', loyaltyRecord.id)
        .single();

      const currentEarned = (current as { lifetime_earned: number } | null)
        ?.lifetime_earned || 0;

      await supabase
        .from('loyalty_points')
        .update({
          balance: balanceAfter,
          lifetime_earned: currentEarned + points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', loyaltyRecord.id);
    }

    logger.info('Points awarded', {
      customerId,
      points,
      transactionType,
      balanceAfter,
      transactionId: (transaction as { id: string }).id,
    });

    return (transaction as { id: string }).id;
  } catch (error) {
    logger.error('Error awarding points', error, { customerId, points });
    return null;
  }
}

/**
 * Award points for completed booking
 * Called after payment is confirmed
 */
export async function awardPointsForBooking(
  customerId: string,
  bookingId: string,
  bookingValue: number
): Promise<boolean> {
  const points = await calculatePointsFromBooking(bookingValue);

  if (points <= 0) {
    logger.info('No points to award (booking value too low)', {
      customerId,
      bookingId,
      bookingValue,
    });
    return false;
  }

  const transactionId = await awardPoints(
    customerId,
    points,
    'earn_booking',
    bookingId,
    undefined,
    `Poin dari booking senilai Rp ${bookingValue.toLocaleString('id-ID')}`
  );

  return transactionId !== null;
}

/**
 * Award points for leaving a review
 */
export async function awardPointsForReview(
  customerId: string,
  bookingId: string
): Promise<boolean> {
  const transactionId = await awardPoints(
    customerId,
    (await getPointsSettings()).reviewBonus,
    'earn_review',
    bookingId,
    undefined,
    'Bonus poin untuk review'
  );

  return transactionId !== null;
}

/**
 * Redeem points as discount
 */
export async function redeemPoints(
  customerId: string,
  pointsToRedeem: number,
  bookingId: string
): Promise<{
  success: boolean;
  discountAmount: number;
  error?: string;
}> {
  if (pointsToRedeem <= 0) {
    return { success: false, discountAmount: 0, error: 'Invalid points amount' };
  }

  const supabase = await createClient();

  try {
    // Get current balance
    const loyaltyRecord = await getOrCreateLoyaltyRecord(customerId);
    if (!loyaltyRecord) {
      return { success: false, discountAmount: 0, error: 'Failed to get loyalty record' };
    }

    if (loyaltyRecord.balance < pointsToRedeem) {
      return {
        success: false,
        discountAmount: 0,
        error: `Insufficient points. Available: ${loyaltyRecord.balance}`,
      };
    }

    const balanceBefore = loyaltyRecord.balance;
    const balanceAfter = balanceBefore - pointsToRedeem;
    const discountAmount = await calculateDiscountFromPoints(pointsToRedeem);

    // Create transaction (negative points for redemption)
    const { data: transaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        loyalty_id: loyaltyRecord.id,
        transaction_type: 'redeem',
        points: -pointsToRedeem,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        booking_id: bookingId,
        description: `Redeem ${pointsToRedeem} poin untuk diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
      })
      .select('id')
      .single();

    if (txError) {
      logger.error('Failed to create redemption transaction', txError, {
        customerId,
        pointsToRedeem,
      });
      return { success: false, discountAmount: 0, error: 'Transaction failed' };
    }

    // Update balance
    const { data: current } = await supabase
      .from('loyalty_points')
      .select('lifetime_spent')
      .eq('id', loyaltyRecord.id)
      .single();

    const currentSpent = (current as { lifetime_spent: number } | null)
      ?.lifetime_spent || 0;

    await supabase
      .from('loyalty_points')
      .update({
        balance: balanceAfter,
        lifetime_spent: currentSpent + pointsToRedeem,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loyaltyRecord.id);

    logger.info('Points redeemed', {
      customerId,
      pointsToRedeem,
      discountAmount,
      balanceAfter,
      transactionId: (transaction as { id: string }).id,
    });

    return { success: true, discountAmount };
  } catch (error) {
    logger.error('Error redeeming points', error, { customerId, pointsToRedeem });
    return { success: false, discountAmount: 0, error: 'Redemption failed' };
  }
}

/**
 * Estimate points that will be earned from a booking
 */
export async function estimatePointsFromBooking(bookingValue: number): Promise<{
  points: number;
  value: number;
}> {
  const points = await calculatePointsFromBooking(bookingValue);
  const value = await getPointsValue(points);
  return {
    points,
    value,
  };
}

/**
 * Check if user can redeem specific amount of points
 */
export async function canRedeemPoints(
  customerId: string,
  points: number
): Promise<boolean> {
  const balance = await getPointsBalance(customerId);
  if (!balance) {
    return false;
  }
  return balance.balance >= points;
}

