/**
 * API: Partner Reward Points Redemption
 * POST /api/partner/rewards/redeem - Redeem points for discount voucher
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { MIN_REDEMPTION_POINTS } from '@/lib/partner/reward-rules';
import { redeemPoints } from '@/lib/partner/reward-points';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const redeemSchema = z.object({
  points: z.number().min(MIN_REDEMPTION_POINTS, `Minimum redemption is ${MIN_REDEMPTION_POINTS} points`),
  description: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { points, description } = redeemSchema.parse(body);

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

    // Check balance first
    const { getPointsBalance } = await import('@/lib/partner/reward-points');
    const balance = await getPointsBalance(partnerId);

    if (!balance || balance.balance < points) {
      return NextResponse.json(
        { error: 'Insufficient points balance' },
        { status: 400 }
      );
    }

    // Redeem points
    const transactionId = await redeemPoints(
      partnerId,
      points,
      description || `Redeemed ${points} points for discount`,
      { redeemedBy: user.id }
    );

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Failed to redeem points' },
        { status: 500 }
      );
    }

    // Calculate discount amount (1 point = Rp 1)
    const discountAmount = points;

    logger.info('Points redeemed', {
      partnerId,
      points,
      discountAmount,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      discountAmount,
      message: `Berhasil menukar ${points} poin menjadi diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    });
  } catch (error) {
    logger.error('Failed to redeem points', error, {
      userId: user.id,
    });
    throw error;
  }
});

