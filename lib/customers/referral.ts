/**
 * Referral System Library
 * Member-Get-Member referral program
 * Based on PRD 5.3.B - Loyalty System (Referral)
 *
 * Referral Rules:
 * - Referee (new user): Gets Rp 50,000 discount on first booking
 * - Referrer (existing user): Gets 10,000 points after referee's trip completion
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Referral status
 */
export type ReferralStatus = 'pending' | 'completed' | 'expired' | 'cancelled';

/**
 * Referral code data
 */
export type ReferralCode = {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  totalBookings: number;
  totalCommission: number;
  isActive: boolean;
  createdAt: string;
};

/**
 * Referral tracking data
 */
export type Referral = {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: ReferralStatus;
  refereeDiscount: number;
  referrerPoints: number;
  bookingId: string | null;
  completedAt: string | null;
  refereeRewardClaimed: boolean;
  referrerRewardClaimed: boolean;
  createdAt: string;
};

/**
 * Referral statistics
 */
export type ReferralStats = {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  referrals: Array<{
    id: string;
    refereeId: string;
    status: ReferralStatus;
    createdAt: string;
    completedAt: string | null;
    pointsEarned: number;
  }>;
};

// Constants from PRD 5.3.B
const REFEREE_DISCOUNT = 50000; // Rp 50,000
const REFERRER_POINTS = 10000; // 10,000 points

/**
 * Get or generate referral code for a user
 */
export async function getOrGenerateReferralCode(
  userId: string
): Promise<ReferralCode | null> {
  const supabase = await createClient();

  // Check existing code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const row = existing as {
      id: string;
      user_id: string;
      code: string;
      total_referrals: number;
      total_bookings: number;
      total_commission: number;
      is_active: boolean;
      created_at: string;
    };
    return {
      id: row.id,
      userId: row.user_id,
      code: row.code,
      totalReferrals: row.total_referrals,
      totalBookings: row.total_bookings,
      totalCommission: row.total_commission,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  // Generate new code using database function
  const { data: codeResult, error: codeError } = await supabase.rpc(
    'generate_referral_code',
    { user_id: userId }
  );

  if (codeError) {
    logger.error('Failed to generate referral code', codeError, { userId });
    // Fallback to simple code generation
    const fallbackCode = `AERO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: newCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code: fallbackCode,
        total_referrals: 0,
        total_bookings: 0,
        total_commission: 0,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert referral code', insertError, { userId });
      return null;
    }

    const row = newCode as {
      id: string;
      user_id: string;
      code: string;
      total_referrals: number;
      total_bookings: number;
      total_commission: number;
      is_active: boolean;
      created_at: string;
    };

    return {
      id: row.id,
      userId: row.user_id,
      code: row.code,
      totalReferrals: row.total_referrals,
      totalBookings: row.total_bookings,
      totalCommission: row.total_commission,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  // Insert new code
  const generatedCode = codeResult as string;
  const { data: newCode, error: insertError } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code: generatedCode,
      total_referrals: 0,
      total_bookings: 0,
      total_commission: 0,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to insert referral code', insertError, { userId });
    return null;
  }

  logger.info('Referral code generated', { userId, code: generatedCode });

  const row = newCode as {
    id: string;
    user_id: string;
    code: string;
    total_referrals: number;
    total_bookings: number;
    total_commission: number;
    is_active: boolean;
    created_at: string;
  };

  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    totalReferrals: row.total_referrals,
    totalBookings: row.total_bookings,
    totalCommission: row.total_commission,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/**
 * Validate and get referral code details
 */
export async function validateReferralCode(
  code: string
): Promise<{ valid: boolean; referrerId?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referral_codes')
    .select('user_id, is_active')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: 'Kode referral tidak ditemukan' };
  }

  const row = data as { user_id: string; is_active: boolean };

  if (!row.is_active) {
    return { valid: false, error: 'Kode referral sudah tidak aktif' };
  }

  return { valid: true, referrerId: row.user_id };
}

/**
 * Apply referral code for new user
 * Creates referral tracking record and returns discount amount
 */
export async function applyReferralCode(
  newUserId: string,
  code: string
): Promise<{
  success: boolean;
  discount: number;
  error?: string;
}> {
  const supabase = await createClient();

  // Validate code
  const validation = await validateReferralCode(code);
  if (!validation.valid || !validation.referrerId) {
    return { success: false, discount: 0, error: validation.error };
  }

  // Check if user is trying to use own code
  if (validation.referrerId === newUserId) {
    return {
      success: false,
      discount: 0,
      error: 'Tidak dapat menggunakan kode referral sendiri',
    };
  }

  // Check if user already has a referral
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referee_id', newUserId)
    .single();

  if (existing) {
    return {
      success: false,
      discount: 0,
      error: 'Anda sudah menggunakan kode referral sebelumnya',
    };
  }

  // Create referral record
  const { error: insertError } = await supabase.from('referrals').insert({
    referrer_id: validation.referrerId,
    referee_id: newUserId,
    referral_code: code.toUpperCase(),
    status: 'pending',
    referee_discount: REFEREE_DISCOUNT,
    referrer_points: REFERRER_POINTS,
    referee_reward_claimed: false,
    referrer_reward_claimed: false,
  });

  if (insertError) {
    logger.error('Failed to create referral', insertError, {
      newUserId,
      code,
    });
    return { success: false, discount: 0, error: 'Gagal menyimpan referral' };
  }

  // Update referral code stats
  await supabase
    .from('referral_codes')
    .update({
      total_referrals: supabase.rpc('increment_value', { value: 1 }),
    })
    .eq('code', code.toUpperCase());

  logger.info('Referral code applied', {
    newUserId,
    code,
    referrerId: validation.referrerId,
    discount: REFEREE_DISCOUNT,
  });

  return { success: true, discount: REFEREE_DISCOUNT };
}

/**
 * Get user's pending referral discount
 * Used at checkout to automatically apply discount
 */
export async function getPendingReferralDiscount(
  userId: string
): Promise<{
  hasDiscount: boolean;
  amount: number;
  referralId?: string;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('referrals')
    .select('id, referee_discount, referee_reward_claimed')
    .eq('referee_id', userId)
    .eq('status', 'pending')
    .eq('referee_reward_claimed', false)
    .single();

  if (!data) {
    return { hasDiscount: false, amount: 0 };
  }

  const row = data as {
    id: string;
    referee_discount: number;
    referee_reward_claimed: boolean;
  };

  return {
    hasDiscount: true,
    amount: row.referee_discount,
    referralId: row.id,
  };
}

/**
 * Mark referee discount as claimed
 * Called after first booking payment
 */
export async function claimRefereeDiscount(
  referralId: string,
  bookingId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('referrals')
    .update({
      referee_reward_claimed: true,
      booking_id: bookingId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId);

  if (error) {
    logger.error('Failed to claim referee discount', error, { referralId });
    return false;
  }

  logger.info('Referee discount claimed', { referralId, bookingId });
  return true;
}

/**
 * Complete referral and award points to referrer
 * Called after referee's first trip is completed
 */
export async function completeReferral(
  bookingId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Use database function for atomic operation
  const { data, error } = await supabase.rpc('complete_referral', {
    p_booking_id: bookingId,
  });

  if (error) {
    logger.error('Failed to complete referral', error, { bookingId });
    return false;
  }

  const success = data as boolean;

  if (success) {
    logger.info('Referral completed', { bookingId });
  }

  return success;
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(
  userId: string
): Promise<ReferralStats | null> {
  const supabase = await createClient();

  // Get user's referral code
  const referralCode = await getOrGenerateReferralCode(userId);
  if (!referralCode) {
    return null;
  }

  // Get all referrals for this user
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  const referralList = (referrals || []).map((r) => {
    const row = r as {
      id: string;
      referee_id: string;
      status: ReferralStatus;
      created_at: string;
      completed_at: string | null;
      referrer_points: number;
      referrer_reward_claimed: boolean;
    };
    return {
      id: row.id,
      refereeId: row.referee_id,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      pointsEarned: row.referrer_reward_claimed ? row.referrer_points : 0,
    };
  });

  const successfulReferrals = referralList.filter(
    (r) => r.status === 'completed'
  ).length;
  const pendingReferrals = referralList.filter(
    (r) => r.status === 'pending'
  ).length;
  const totalPointsEarned = referralList.reduce(
    (sum, r) => sum + r.pointsEarned,
    0
  );

  return {
    code: referralCode.code,
    totalReferrals: referralCode.totalReferrals,
    successfulReferrals,
    pendingReferrals,
    totalPointsEarned,
    referrals: referralList,
  };
}

/**
 * Generate share message for referral
 */
export function generateShareMessage(code: string): {
  text: string;
  whatsappUrl: string;
  twitterUrl: string;
} {
  const text = `Booking trip pakai kode referral saya "${code}" dan dapat diskon Rp 50.000! 🎉 Download sekarang di aerotravel.co.id`;
  const encodedText = encodeURIComponent(text);

  return {
    text,
    whatsappUrl: `https://wa.me/?text=${encodedText}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodedText}`,
  };
}

