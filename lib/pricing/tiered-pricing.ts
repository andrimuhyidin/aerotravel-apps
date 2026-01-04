/**
 * Tiered Pricing Engine
 * PRD 4.2 - Dynamic pricing based on pax count
 */

import { calculateDiscount, type DiscountType } from './discount-codes';

export type PriceTier = {
  min_pax: number;
  max_pax: number;
  price_publish: number;
  price_nta?: number;
  price_weekend?: number;
};

export type PricingResult = {
  pricePerAdult: number;
  pricePerChild: number;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  tier: PriceTier | null;
  isWeekend: boolean;
};

export type DiscountInfo = {
  code: string;
  type: DiscountType;
  value: number;
  maxAmount?: number;
};

export type PricingInput = {
  priceTiers: PriceTier[];
  adultPax: number;
  childPax?: number;
  infantPax?: number;
  tripDate?: Date;
  childDiscountPercent?: number; // Default 30%
  discountCode?: string;
  // Pre-validated discount info (from server validation)
  discountInfo?: DiscountInfo;
};

/**
 * Check if date is weekend (Saturday/Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Find applicable price tier based on total pax
 */
export function findPriceTier(
  tiers: PriceTier[],
  totalPax: number
): PriceTier | null {
  // Sort tiers by min_pax ascending
  const sortedTiers = [...tiers].sort((a, b) => a.min_pax - b.min_pax);

  // Find matching tier
  const tier = sortedTiers.find(
    (t) => totalPax >= t.min_pax && totalPax <= t.max_pax
  );

  // If no exact match, use the last tier (highest pax range)
  if (!tier && sortedTiers.length > 0) {
    return sortedTiers[sortedTiers.length - 1] ?? null;
  }

  return tier ?? null;
}

/**
 * Calculate total pricing
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const {
    priceTiers,
    adultPax,
    childPax = 0,
    tripDate,
    childDiscountPercent = 30,
    discountCode,
    discountInfo,
  } = input;

  const totalPax = adultPax + childPax; // Infants don't count for pricing tier
  const tier = findPriceTier(priceTiers, totalPax);

  if (!tier) {
    return {
      pricePerAdult: 0,
      pricePerChild: 0,
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      tier: null,
      isWeekend: false,
    };
  }

  // Check weekend pricing
  const checkWeekend = tripDate ? isWeekend(tripDate) : false;
  const basePrice =
    checkWeekend && tier.price_weekend
      ? tier.price_weekend
      : tier.price_publish;

  // Calculate child price (with discount)
  const childDiscount = childDiscountPercent / 100;
  const pricePerChild = Math.round(basePrice * (1 - childDiscount));

  // Calculate subtotal
  const subtotal = basePrice * adultPax + pricePerChild * childPax;

  // Apply discount code if provided and validated
  let discountAmount = 0;
  if (discountInfo) {
    discountAmount = calculateDiscount(
      subtotal,
      discountInfo.type,
      discountInfo.value,
      discountInfo.maxAmount
    );
  }

  return {
    pricePerAdult: basePrice,
    pricePerChild,
    subtotal,
    discountAmount,
    discountCode: discountInfo ? discountCode : undefined,
    total: subtotal - discountAmount,
    tier,
    isWeekend: checkWeekend,
  };
}

/**
 * Get lowest price from tiers (for display)
 */
export function getLowestPrice(tiers: PriceTier[]): number {
  if (tiers.length === 0) return 0;
  return Math.min(...tiers.map((t) => t.price_publish));
}

/**
 * Get price range string
 */
export function getPriceRangeString(tiers: PriceTier[]): string {
  if (tiers.length === 0) return 'Hubungi kami';

  const prices = tiers.map((t) => t.price_publish);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const format = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n);

  if (min === max) {
    return format(min);
  }

  return `${format(min)} - ${format(max)}`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}
