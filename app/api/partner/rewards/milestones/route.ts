/**
 * API: Partner Reward Milestones
 * GET /api/partner/rewards/milestones - Get milestone progress & achievements
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { getMilestones } from '@/lib/partner/reward-points';
import { MILESTONE_CONFIGS } from '@/lib/partner/reward-rules';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get partner ID
    const client = supabase as unknown as any;
    const { data: userProfile } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let partnerId = user.id;
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
      }
    }

    // Get achieved milestones
    const achievedMilestones = await getMilestones(partnerId);
    const achievedTypes = new Set(achievedMilestones.map((m) => m.type));

    // Get current stats for progress calculation
    const { data: bookingStats } = await client
      .from('bookings')
      .select('id, nta_total')
      .eq('mitra_id', partnerId)
      .is('deleted_at', null)
      .in('status', ['paid', 'confirmed', 'ongoing', 'completed']);

    const totalBookings = bookingStats?.length || 0;
    const totalRevenue = bookingStats?.reduce((sum: number, b: { nta_total: number }) => sum + Number(b.nta_total || 0), 0) || 0;

    // Calculate progress for each milestone
    const milestones = MILESTONE_CONFIGS.map((config) => {
      const achieved = achievedTypes.has(config.type);
      const currentValue = config.type.startsWith('bookings_')
        ? totalBookings
        : totalRevenue;
      const progress = Math.min(100, (currentValue / config.value) * 100);

      return {
        ...config,
        achieved,
        currentValue,
        progress,
        pointsAwarded: achieved
          ? achievedMilestones.find((m) => m.type === config.type)?.pointsAwarded || 0
          : 0,
        achievedAt: achieved
          ? achievedMilestones.find((m) => m.type === config.type)?.achievedAt
          : null,
      };
    });

    return NextResponse.json({
      milestones,
      stats: {
        totalBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    logger.error('Failed to get milestones', error, {
      userId: user.id,
    });
    throw error;
  }
});

