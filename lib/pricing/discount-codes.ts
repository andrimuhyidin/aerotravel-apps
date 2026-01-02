/**
 * Discount Code Service
 * Validates and applies discount codes to bookings
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type DiscountType = 'percentage' | 'fixed';

export type DiscountValidationResult = {
  isValid: boolean;
  discountCodeId?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  calculatedDiscount?: number;
  errorMessage?: string;
};

export type DiscountCodeInfo = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
};

/**
 * Validate a discount code
 * Uses database RPC function for comprehensive validation
 */
export async function validateDiscountCode(
  code: string,
  options: {
    branchId?: string;
    packageId?: string;
    orderAmount?: number;
    userId?: string;
  } = {}
): Promise<DiscountValidationResult> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('validate_discount_code', {
      p_code: code,
      p_branch_id: options.branchId || null,
      p_package_id: options.packageId || null,
      p_order_amount: options.orderAmount || 0,
      p_user_id: options.userId || null,
    });

    if (error) {
      logger.error('Failed to validate discount code', error, { code });
      return {
        isValid: false,
        errorMessage: 'Gagal memvalidasi kode diskon',
      };
    }

    const result = data?.[0];
    if (!result) {
      return {
        isValid: false,
        errorMessage: 'Kode diskon tidak ditemukan',
      };
    }

    return {
      isValid: result.is_valid,
      discountCodeId: result.discount_code_id,
      discountType: result.discount_type as DiscountType,
      discountValue: result.discount_value,
      maxDiscountAmount: result.max_discount_amount,
      calculatedDiscount: result.calculated_discount,
      errorMessage: result.error_message,
    };
  } catch (error) {
    logger.error('Discount code validation error', error, { code });
    return {
      isValid: false,
      errorMessage: 'Terjadi kesalahan saat memvalidasi kode diskon',
    };
  }
}

/**
 * Calculate discount amount for a given subtotal
 * Does NOT validate the code - use validateDiscountCode first
 */
export function calculateDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscountAmount?: number
): number {
  let discount: number;

  if (discountType === 'percentage') {
    discount = subtotal * (discountValue / 100);
    if (maxDiscountAmount && discount > maxDiscountAmount) {
      discount = maxDiscountAmount;
    }
  } else {
    // Fixed amount - cannot exceed subtotal
    discount = Math.min(discountValue, subtotal);
  }

  return Math.round(discount);
}

/**
 * Apply discount code to a booking
 * Records usage and increments counter
 */
export async function applyDiscountCode(
  code: string,
  userId: string,
  bookingId: string,
  discountAmount: number
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('apply_discount_code', {
      p_code: code,
      p_user_id: userId,
      p_booking_id: bookingId,
      p_discount_amount: discountAmount,
    });

    if (error) {
      logger.error('Failed to apply discount code', error, { code, bookingId });
      return false;
    }

    logger.info('Discount code applied', {
      code,
      userId,
      bookingId,
      discountAmount,
    });

    return data === true;
  } catch (error) {
    logger.error('Discount code application error', error, { code, bookingId });
    return false;
  }
}

/**
 * Get discount code details by code
 */
export async function getDiscountCodeByCode(
  code: string
): Promise<DiscountCodeInfo | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      discountType: data.discount_type as DiscountType,
      discountValue: data.discount_value,
      maxDiscountAmount: data.max_discount_amount,
      minOrderAmount: data.min_order_amount || 0,
      validFrom: data.valid_from,
      validUntil: data.valid_until,
      isActive: data.is_active,
    };
  } catch (error) {
    logger.error('Failed to get discount code', error, { code });
    return null;
  }
}

/**
 * Get user's discount code usage count for a specific code
 */
export async function getUserDiscountUsage(
  userId: string,
  discountCodeId: string
): Promise<number> {
  const supabase = await createClient();

  try {
    const { count, error } = await supabase
      .from('discount_code_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('discount_code_id', discountCodeId);

    if (error) {
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

