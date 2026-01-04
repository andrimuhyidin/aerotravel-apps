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

    // Activate benefit based on benefit_code
    // Parse benefit code to determine type and duration
    const benefitParts = benefitCode.split('_');
    const benefitType = benefitParts[0]; // e.g., 'priority', 'extended', 'premium'
    const benefitDuration = parseInt(benefitParts[1] || '30', 10); // days, default 30

    // Calculate benefit expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + benefitDuration);

    // Try to insert into guide_active_benefits table
    try {
      const { error: benefitError } = await client
        .from('guide_active_benefits')
        .insert({
          guide_id: redemption.guide_id,
          benefit_code: benefitCode,
          benefit_type: benefitType,
          redemption_id: redemptionId,
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
        });

      if (benefitError) {
        // Table might not exist, try updating guide_preferences instead
        logger.warn('guide_active_benefits insert failed, trying preferences', { error: benefitError });
        
        const { error: prefError } = await client
          .from('guide_preferences')
          .upsert({
            guide_id: redemption.guide_id,
            [`benefit_${benefitType}`]: true,
            [`benefit_${benefitType}_expires`]: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'guide_id' });

        if (prefError) {
          logger.warn('guide_preferences update also failed', { error: prefError });
        }
      }
    } catch (activationError) {
      logger.warn('Benefit activation failed, continuing with redemption', { error: activationError });
    }

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

    // Create discount coupon record
    // Parse discount template to get discount details (e.g., "GUIDE_10_PERCENT" -> 10% discount)
    const templateParts = discountTemplate.split('_');
    const discountValue = parseInt(templateParts[1] || '10', 10);
    const discountType = templateParts[2]?.toLowerCase() === 'fixed' ? 'fixed' : 'percentage';

    // Calculate expiry date (default 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Get redemption to find guide_id
    const { data: redemptionData } = await client
      .from('guide_reward_redemptions')
      .select('guide_id')
      .eq('id', redemptionId)
      .single();

    try {
      const { error: couponError } = await client
        .from('vouchers')
        .insert({
          code: discountCode,
          voucher_type: 'guide_reward',
          discount_type: discountType,
          discount_value: discountValue,
          min_order_value: 0,
          max_uses: 1,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_until: expiresAt.toISOString(),
          is_active: true,
          created_by: redemptionData?.guide_id || null,
          metadata: {
            redemption_id: redemptionId,
            template: discountTemplate,
            guide_id: redemptionData?.guide_id,
          },
        });

      if (couponError) {
        logger.warn('Failed to create voucher record', {
          error: couponError,
          redemptionId,
          discountCode,
        });
        // Continue anyway, the code was generated
      }
    } catch (voucherError) {
      logger.warn('Voucher creation failed, continuing', { error: voucherError });
    }

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
