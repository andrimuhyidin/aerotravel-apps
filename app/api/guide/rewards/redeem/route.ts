/**
 * API: Guide Reward Redemption
 * POST /api/guide/rewards/redeem - Redeem a reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import {
  createRedemption,
  processCashbackRedemption,
  processVoucherRedemption,
  processMerchandiseRedemption,
  processBenefitRedemption,
  processDiscountRedemption,
} from '@/lib/guide/reward-redemption';
import { getPointsBalance } from '@/lib/guide/reward-points';
import { logger } from '@/lib/utils/logger';

/**
 * Create notification for redemption status
 */
async function notifyRedemptionStatus(
  guideId: string,
  status: string,
  rewardTitle: string,
  voucherCode?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as any;

    let title = '';
    let message = '';

    switch (status) {
      case 'pending':
        title = 'Penukaran Reward Diproses';
        message = `Penukaran reward "${rewardTitle}" sedang diproses.`;
        break;
      case 'completed':
        title = 'Reward Siap Digunakan!';
        message = voucherCode
          ? `Penukaran reward "${rewardTitle}" selesai! Kode voucher: ${voucherCode}`
          : `Penukaran reward "${rewardTitle}" selesai!`;
        break;
      case 'cancelled':
        title = 'Penukaran Dibatalkan';
        message = `Penukaran reward "${rewardTitle}" telah dibatalkan. Poin telah dikembalikan.`;
        break;
      case 'failed':
        title = 'Penukaran Gagal';
        message = `Penukaran reward "${rewardTitle}" gagal. Poin telah dikembalikan.`;
        break;
      default:
        return;
    }

    await client.from('notification_logs').insert({
      user_id: guideId,
      channel: 'push',
      subject: title,
      body: message,
      status: 'pending',
      entity_type: 'reward_redemption',
      metadata: {
        status,
        rewardTitle,
        voucherCode,
      },
    });
  } catch (error) {
    logger.warn('Failed to create redemption status notification', {
      error,
      guideId,
      status,
      rewardTitle,
    });
  }
}

const redeemSchema = z.object({
  catalog_id: z.string().uuid(),
  delivery_info: z
    .object({
      address: z.string(),
      phone: z.string(),
      notes: z.string().optional(),
    })
    .optional(), // Required for merchandise type
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate request body
  const body = await request.json();
  const validated = redeemSchema.parse(body);

  // Get reward catalog details
  const { data: reward, error: rewardError } = await client
    .from('guide_reward_catalog')
    .select('*')
    .eq('id', validated.catalog_id)
    .eq('is_active', true)
    .single();

  if (rewardError || !reward) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
  }

  // Check if reward is available
  const { data: isAvailable } = await client.rpc('is_reward_available', {
    p_catalog_id: validated.catalog_id,
    p_guide_level: null, // Will be calculated in function
  });

  if (!isAvailable) {
    return NextResponse.json(
      { error: 'Reward is not available (out of stock, expired, or level requirement not met)' },
      { status: 400 }
    );
  }

  // Check points balance
  const balance = await getPointsBalance(user.id);
  if (!balance || balance.balance < reward.points_cost) {
    return NextResponse.json(
      { error: 'Insufficient points balance' },
      { status: 400 }
    );
  }

  // Validate delivery info for merchandise
  if (reward.reward_type === 'merchandise' && !validated.delivery_info) {
    return NextResponse.json(
      { error: 'Delivery information is required for merchandise rewards' },
      { status: 400 }
    );
  }

  // Create redemption
  const redemptionId = await createRedemption(
    user.id,
    validated.catalog_id,
    reward.points_cost
  );

  if (!redemptionId) {
    return NextResponse.json(
      { error: 'Failed to create redemption' },
      { status: 500 }
    );
  }

  // Process redemption based on type
  let processed = false;
  let result: string | boolean | null = null;

  try {
    switch (reward.reward_type) {
      case 'cashback':
        processed = await processCashbackRedemption(
          redemptionId,
          Number(reward.cash_value || 0)
        );
        break;

      case 'voucher':
        result = await processVoucherRedemption(
          redemptionId,
          reward.voucher_code_template || ''
        );
        processed = result !== null;
        break;

      case 'merchandise':
        processed = await processMerchandiseRedemption(
          redemptionId,
          validated.delivery_info!
        );
        break;

      case 'benefit':
        processed = await processBenefitRedemption(
          redemptionId,
          reward.benefit_code || ''
        );
        break;

      case 'discount':
        result = await processDiscountRedemption(
          redemptionId,
          reward.discount_code_template || ''
        );
        processed = result !== null;
        break;

      default:
        logger.error('Unknown reward type', {
          rewardType: reward.reward_type,
          redemptionId,
        });
        return NextResponse.json(
          { error: 'Unknown reward type' },
          { status: 500 }
        );
    }

    if (!processed) {
      // Refund points if processing failed
      logger.error('Redemption processing failed', {
        redemptionId,
        rewardType: reward.reward_type,
      });
      return NextResponse.json(
        { error: 'Failed to process redemption' },
        { status: 500 }
      );
    }

    logger.info('Reward redeemed successfully', {
      redemptionId,
      guideId: user.id,
      rewardType: reward.reward_type,
      pointsCost: reward.points_cost,
    });

    // Create notification for redemption
    await notifyRedemptionStatus(
      user.id,
      'completed',
      reward.title,
      result || undefined
    ).catch((error) => {
      logger.warn('Failed to create redemption notification', {
        error,
        redemptionId,
        guideId: user.id,
      });
    });

    return NextResponse.json({
      success: true,
      redemptionId,
      voucherCode: result || undefined,
    });
  } catch (error) {
    logger.error('Exception processing redemption', error, {
      redemptionId,
      rewardType: reward.reward_type,
    });
    return NextResponse.json(
      { error: 'Failed to process redemption' },
      { status: 500 }
    );
  }
});

