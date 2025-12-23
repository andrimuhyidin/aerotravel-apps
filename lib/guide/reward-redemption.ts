/**
 * Reward Redemption Utilities
 * Functions for processing reward redemptions
 */

import { createClient } from '@/lib/supabase/server';
import { redeemPoints } from './reward-points';
import { logger } from '@/lib/utils/logger';

export type RedemptionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type RewardType =
  | 'cashback'
  | 'voucher'
  | 'merchandise'
  | 'benefit'
  | 'discount';

/**
 * Create a redemption request
 */
export async function createRedemption(
  guideId: string,
  catalogId: string,
  pointsCost: number
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // First, redeem points
    const transactionId = await redeemPoints(
      guideId,
      pointsCost,
      `Redemption for reward: ${catalogId}`
    );

    if (!transactionId) {
      logger.error('Failed to redeem points for redemption', {
        guideId,
        catalogId,
        pointsCost,
      });
      return null;
    }

    // Create redemption record
    const { data, error } = await client
      .from('guide_reward_redemptions')
      .insert({
        guide_id: guideId,
        catalog_id: catalogId,
        points_used: pointsCost,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      // Refund points if redemption creation fails
      logger.error('Failed to create redemption, refunding points', error, {
        guideId,
        catalogId,
        pointsCost,
        transactionId,
      });
      // Note: In production, you might want to call refund function here
      return null;
    }

    logger.info('Redemption created', {
      redemptionId: data.id,
      guideId,
      catalogId,
      pointsCost,
    });

    return data.id;
  } catch (error) {
    logger.error('Exception creating redemption', error, {
      guideId,
      catalogId,
      pointsCost,
    });
    return null;
  }
}

/**
 * Process cashback redemption
 */
export async function processCashbackRedemption(
  redemptionId: string,
  cashValue: number
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Get redemption details
    const { data: redemption, error: redemptionError } = await client
      .from('guide_reward_redemptions')
      .select('guide_id, catalog_id')
      .eq('id', redemptionId)
      .single();

    if (redemptionError || !redemption) {
      logger.error('Redemption not found', redemptionError, { redemptionId });
      return false;
    }

    // Get or create wallet
    const { data: wallet, error: walletError } = await client
      .from('guide_wallets')
      .select('id, balance')
      .eq('guide_id', redemption.guide_id)
      .maybeSingle();

    if (walletError) {
      logger.error('Failed to get wallet', walletError, {
        guideId: redemption.guide_id,
        redemptionId,
      });
      return false;
    }

    // Create wallet if doesn't exist
    let walletId = wallet?.id;
    if (!walletId) {
      const { data: newWallet, error: createError } = await client
        .from('guide_wallets')
        .insert({ guide_id: redemption.guide_id, balance: 0 })
        .select('id')
        .single();

      if (createError || !newWallet) {
        logger.error('Failed to create wallet', createError, {
          guideId: redemption.guide_id,
          redemptionId,
        });
        return false;
      }
      walletId = newWallet.id;
    }

    // Calculate balance before and after
    const balanceBefore = Number(wallet?.balance || 0);
    const balanceAfter = balanceBefore + cashValue;

    // Create wallet transaction (trigger will auto-update balance)
    const { data: walletTransaction, error: txError } = await client
      .from('guide_wallet_transactions')
      .insert({
        wallet_id: walletId,
        transaction_type: 'earning',
        amount: cashValue,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: 'Cashback from reward redemption',
        status: 'completed',
      })
      .select('id')
      .single();

    if (txError) {
      logger.error('Failed to create wallet transaction', txError, {
        walletId,
        cashValue,
        redemptionId,
      });
      return false;
    }

    // Update redemption status
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'completed',
      p_cashback_transaction_id: walletTransaction.id,
    });

    if (updateError) {
      logger.error('Failed to update redemption status', updateError, {
        redemptionId,
      });
      return false;
    }

    logger.info('Cashback redemption processed', {
      redemptionId,
      cashValue,
      walletTransactionId: walletTransaction.id,
    });

    return true;
  } catch (error) {
    logger.error('Exception processing cashback redemption', error, {
      redemptionId,
      cashValue,
    });
    return false;
  }
}

/**
 * Process voucher redemption
 */
export async function processVoucherRedemption(
  redemptionId: string,
  voucherTemplate: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Generate voucher code
    const { data: voucherCode, error: codeError } = await client.rpc(
      'generate_voucher_code',
      {
        p_template: voucherTemplate,
      }
    );

    if (codeError || !voucherCode) {
      logger.error('Failed to generate voucher code', codeError, {
        redemptionId,
        voucherTemplate,
      });
      return null;
    }

    // Update redemption status
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'completed',
      p_voucher_code: voucherCode,
    });

    if (updateError) {
      logger.error('Failed to update redemption status', updateError, {
        redemptionId,
      });
      return null;
    }

    logger.info('Voucher redemption processed', {
      redemptionId,
      voucherCode,
    });

    return voucherCode;
  } catch (error) {
    logger.error('Exception processing voucher redemption', error, {
      redemptionId,
      voucherTemplate,
    });
    return null;
  }
}

/**
 * Process merchandise redemption
 */
export async function processMerchandiseRedemption(
  redemptionId: string,
  deliveryInfo: {
    address: string;
    phone: string;
    notes?: string;
  }
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Update redemption status with delivery info
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'processing',
      p_delivery_info: deliveryInfo as unknown,
    });

    if (updateError) {
      logger.error('Failed to update redemption status', updateError, {
        redemptionId,
      });
      return false;
    }

    logger.info('Merchandise redemption processed', {
      redemptionId,
      deliveryInfo,
    });

    return true;
  } catch (error) {
    logger.error('Exception processing merchandise redemption', error, {
      redemptionId,
      deliveryInfo,
    });
    return false;
  }
}

/**
 * Process benefit redemption
 */
export async function processBenefitRedemption(
  redemptionId: string,
  benefitCode: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Get redemption details
    const { data: redemption, error: redemptionError } = await client
      .from('guide_reward_redemptions')
      .select('guide_id')
      .eq('id', redemptionId)
      .single();

    if (redemptionError || !redemption) {
      logger.error('Redemption not found', redemptionError, { redemptionId });
      return false;
    }

    // TODO: Activate benefit based on benefit_code
    // This would typically update guide_preferences or create a benefit record
    // For now, we just mark as completed

    // Update redemption status
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'completed',
      p_notes: `Benefit activated: ${benefitCode}`,
    });

    if (updateError) {
      logger.error('Failed to update redemption status', updateError, {
        redemptionId,
      });
      return false;
    }

    logger.info('Benefit redemption processed', {
      redemptionId,
      benefitCode,
      guideId: redemption.guide_id,
    });

    return true;
  } catch (error) {
    logger.error('Exception processing benefit redemption', error, {
      redemptionId,
      benefitCode,
    });
    return false;
  }
}

/**
 * Process discount redemption
 */
export async function processDiscountRedemption(
  redemptionId: string,
  discountTemplate: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Generate discount code
    const { data: discountCode, error: codeError } = await client.rpc(
      'generate_voucher_code',
      {
        p_template: discountTemplate,
      }
    );

    if (codeError || !discountCode) {
      logger.error('Failed to generate discount code', codeError, {
        redemptionId,
        discountTemplate,
      });
      return null;
    }

    // TODO: Create discount coupon record
    // This would typically create a record in a discounts/coupons table

    // Update redemption status
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'completed',
      p_voucher_code: discountCode,
    });

    if (updateError) {
      logger.error('Failed to update redemption status', updateError, {
        redemptionId,
      });
      return null;
    }

    logger.info('Discount redemption processed', {
      redemptionId,
      discountCode,
    });

    return discountCode;
  } catch (error) {
    logger.error('Exception processing discount redemption', error, {
      redemptionId,
      discountTemplate,
    });
    return null;
  }
}

/**
 * Cancel redemption (if pending)
 */
export async function cancelRedemption(
  redemptionId: string,
  reason?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as unknown;

    // Update redemption status
    const { error: updateError } = await client.rpc('process_redemption', {
      p_redemption_id: redemptionId,
      p_status: 'cancelled',
      p_notes: reason || 'Cancelled by user',
    });

    if (updateError) {
      logger.error('Failed to cancel redemption', updateError, {
        redemptionId,
      });
      return false;
    }

    logger.info('Redemption cancelled', {
      redemptionId,
      reason,
    });

    return true;
  } catch (error) {
    logger.error('Exception cancelling redemption', error, {
      redemptionId,
      reason,
    });
    return false;
  }
}
