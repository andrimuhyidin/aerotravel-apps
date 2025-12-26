/**
 * Partner Tier Calculator
 * Calculate partner tier based on bookings and revenue
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type TierCalculationResult = {
  tier: PartnerTier;
  reason: string;
  bookingCount: number;
  totalRevenue: number;
  nextTier?: PartnerTier;
  progressToNextTier?: number; // Percentage
};

/**
 * Calculate partner tier based on booking count and revenue
 */
export async function calculatePartnerTier(
  partnerId: string
): Promise<TierCalculationResult> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    // Get booking count and total revenue
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('id, total_price, status')
      .eq('user_id', partnerId)
      .in('status', ['confirmed', 'completed'])
      .is('deleted_at', null);

    if (bookingsError) {
      logger.error('Failed to fetch bookings for tier calculation', bookingsError, { partnerId });
      throw bookingsError;
    }

    const bookingCount = bookings?.length || 0;
    const totalRevenue =
      bookings?.reduce((sum: number, b: { total_price: number }) => {
        return sum + (Number(b.total_price) || 0);
      }, 0) || 0;

    // Calculate tier (priority: Revenue > Booking Count)
    let tier: PartnerTier = 'bronze';
    let reason = '';
    let nextTier: PartnerTier | undefined;
    let progressToNextTier: number | undefined;

    if (totalRevenue >= 100000000) {
      // 100M+
      tier = 'platinum';
      reason = `Revenue mencapai Rp ${(totalRevenue / 1000000).toFixed(0)}M (Platinum tier)`;
    } else if (totalRevenue >= 50000000) {
      // 50M-100M
      tier = 'gold';
      reason = `Revenue mencapai Rp ${(totalRevenue / 1000000).toFixed(0)}M (Gold tier)`;
      nextTier = 'platinum';
      progressToNextTier = Math.min(100, (totalRevenue / 100000000) * 100);
    } else if (totalRevenue >= 10000000) {
      // 10M-50M
      tier = 'silver';
      reason = `Revenue mencapai Rp ${(totalRevenue / 1000000).toFixed(0)}M (Silver tier)`;
      nextTier = 'gold';
      progressToNextTier = Math.min(100, ((totalRevenue - 10000000) / 40000000) * 100);
    } else if (bookingCount >= 100) {
      // 100+ bookings
      tier = 'platinum';
      reason = `${bookingCount} bookings (Platinum tier)`;
    } else if (bookingCount >= 51) {
      // 51-100 bookings
      tier = 'gold';
      reason = `${bookingCount} bookings (Gold tier)`;
      nextTier = 'platinum';
      progressToNextTier = Math.min(100, ((bookingCount - 51) / 49) * 100);
    } else if (bookingCount >= 11) {
      // 11-50 bookings
      tier = 'silver';
      reason = `${bookingCount} bookings (Silver tier)`;
      nextTier = 'gold';
      progressToNextTier = Math.min(100, ((bookingCount - 11) / 40) * 100);
    } else {
      // 0-10 bookings
      tier = 'bronze';
      reason = `${bookingCount} bookings (Bronze tier)`;
      nextTier = 'silver';
      progressToNextTier = bookingCount > 0 ? Math.min(100, (bookingCount / 11) * 100) : 0;
    }

    return {
      tier,
      reason,
      bookingCount,
      totalRevenue,
      nextTier,
      progressToNextTier,
    };
  } catch (error) {
    logger.error('Failed to calculate partner tier', error, { partnerId });
    // Return default bronze tier on error
    return {
      tier: 'bronze',
      reason: 'Error calculating tier, defaulting to bronze',
      bookingCount: 0,
      totalRevenue: 0,
    };
  }
}

/**
 * Get tier benefits information
 */
export function getTierBenefits(tier: PartnerTier): {
  name: string;
  commission: string;
  benefits: string[];
} {
  const tierInfo = {
    bronze: {
      name: 'Bronze Partner',
      commission: '5%',
      benefits: [
        'Akses ke semua paket wisata',
        'Komisi 5% dari setiap booking',
        'Support via email',
      ],
    },
    silver: {
      name: 'Silver Partner',
      commission: '7%',
      benefits: [
        'Semua benefit Bronze',
        'Komisi 7% dari setiap booking',
        'Priority support',
        'Early access ke paket baru',
      ],
    },
    gold: {
      name: 'Gold Partner',
      commission: '10%',
      benefits: [
        'Semua benefit Silver',
        'Komisi 10% dari setiap booking',
        'Dedicated account manager',
        'Custom pricing untuk paket tertentu',
      ],
    },
    platinum: {
      name: 'Platinum Partner',
      commission: '12%',
      benefits: [
        'Semua benefit Gold',
        'Komisi 12% dari setiap booking',
        'VIP support 24/7',
        'Exclusive paket dan promo',
        'Co-marketing opportunities',
      ],
    },
  };

  return tierInfo[tier];
}

