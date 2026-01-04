/**
 * Partner Reward Integration
 * Auto-award points on booking completion and milestone checks
 */

import { calculateBookingPoints } from './reward-rules';
import { awardPoints, checkAndAwardMilestone } from './reward-points';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/client';

/**
 * Award points for completed booking
 * Called when booking status changes to 'completed'
 */
export async function awardPointsForBooking(
  partnerId: string,
  bookingId: string,
  bookingValue: number
): Promise<boolean> {
  try {
    const points = calculateBookingPoints(bookingValue);
    if (points <= 0) {
      return false; // No points for very small bookings
    }

    const transactionId = await awardPoints(
      partnerId,
      points,
      'earn_booking',
      bookingId,
      `Points dari booking (NTA: Rp ${bookingValue.toLocaleString('id-ID')})`
    );

    if (!transactionId) {
      return false;
    }

    // Check milestones after awarding points
    await checkBookingMilestones(partnerId);

    logger.info('Points awarded for booking', {
      partnerId,
      bookingId,
      bookingValue,
      points,
      transactionId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to award points for booking', error, {
      partnerId,
      bookingId,
    });
    return false;
  }
}

/**
 * Check and award booking/revenue milestones
 */
export async function checkBookingMilestones(partnerId: string): Promise<void> {
  try {
    const supabase = createClient();
    const client = supabase as unknown as any;

    // Get booking stats
    const { data: bookings } = await client
      .from('bookings')
      .select('id, nta_total')
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    if (!bookings || bookings.length === 0) {
      return;
    }

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum: number, b: { nta_total: number }) => sum + Number(b.nta_total || 0),
      0
    );

    // Check booking milestones
    const bookingMilestones: Array<{ type: string; value: number }> = [
      { type: 'bookings_10', value: 10 },
      { type: 'bookings_50', value: 50 },
      { type: 'bookings_100', value: 100 },
      { type: 'bookings_500', value: 500 },
      { type: 'bookings_1000', value: 1000 },
    ];

    for (const milestone of bookingMilestones) {
      if (totalBookings >= milestone.value) {
        await checkAndAwardMilestone(
          partnerId,
          milestone.type as any,
          totalBookings
        );
      }
    }

    // Check revenue milestones
    const revenueMilestones: Array<{ type: string; value: number }> = [
      { type: 'revenue_10m', value: 10_000_000 },
      { type: 'revenue_50m', value: 50_000_000 },
      { type: 'revenue_100m', value: 100_000_000 },
      { type: 'revenue_500m', value: 500_000_000 },
    ];

    for (const milestone of revenueMilestones) {
      if (totalRevenue >= milestone.value) {
        await checkAndAwardMilestone(
          partnerId,
          milestone.type as any,
          totalRevenue
        );
      }
    }
  } catch (error) {
    logger.error('Failed to check milestones', error, { partnerId });
  }
}

