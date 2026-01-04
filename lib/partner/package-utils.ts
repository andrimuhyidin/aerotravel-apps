/**
 * Partner Package Utilities
 * Helper functions for package-related operations
 */

export type PackagePricingTier = {
  minPax: number;
  maxPax: number;
  ntaPrice: number;
  publishPrice: number;
  margin: number;
};

export type PackageSummary = {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  thumbnailUrl: string | null;
  baseNTAPrice: number | null;
  basePublishPrice: number | null;
  margin: number;
  priceRange: {
    nta: { min: number; max: number };
    publish: { min: number; max: number };
  };
  pricingTiers: PackagePricingTier[];
};

/**
 * QuickInfoPackage type for booking flow
 * Matches the structure returned by /api/partner/packages/:id/quick-info
 */
export type QuickInfoPackage = {
  id: string;
  name: string;
  destination: string | null;
  duration: {
    days: number;
    nights: number;
    label: string;
  };
  thumbnailUrl?: string;
  pricingTiers: PackagePricingTier[];
  ratings?: {
    average: number;
    count: number;
  };
  urgency: {
    bookingCountToday: number;
    lastBookedAt?: string;
  };
  availability: {
    status: 'high' | 'medium' | 'low';
    label: string;
  };
};

/**
 * Calculate NTA total for booking
 */
export function calculateNTATotal(
  adultPax: number,
  childPax: number,
  infantPax: number,
  pricingTiers: PackagePricingTier[]
): number {
  // Find appropriate tier based on total adult pax
  const tier =
    pricingTiers.find(
      (t) => adultPax >= t.minPax && adultPax <= t.maxPax
    ) || pricingTiers[0];

  if (!tier) return 0;

  // Child is typically 50% of adult price
  const childPrice = tier.ntaPrice * 0.5;
  // Infant is typically free or very minimal

  const adultTotal = adultPax * tier.ntaPrice;
  const childTotal = childPax * childPrice;
  const infantTotal = infantPax * 0; // Free for infants

  return adultTotal + childTotal + infantTotal;
}

/**
 * Calculate publish total (for margin calculation)
 */
export function calculatePublishTotal(
  adultPax: number,
  childPax: number,
  infantPax: number,
  pricingTiers: PackagePricingTier[]
): number {
  const tier =
    pricingTiers.find(
      (t) => adultPax >= t.minPax && adultPax <= t.maxPax
    ) || pricingTiers[0];

  if (!tier) return 0;

  const childPrice = tier.publishPrice * 0.5;

  const adultTotal = adultPax * tier.publishPrice;
  const childTotal = childPax * childPrice;
  const infantTotal = infantPax * 0;

  return adultTotal + childTotal + infantTotal;
}

/**
 * Calculate margin (commission) for booking
 */
export function calculateMargin(
  adultPax: number,
  childPax: number,
  infantPax: number,
  pricingTiers: PackagePricingTier[]
): number {
  const publishTotal = calculatePublishTotal(
    adultPax,
    childPax,
    infantPax,
    pricingTiers
  );
  const ntaTotal = calculateNTATotal(
    adultPax,
    childPax,
    infantPax,
    pricingTiers
  );

  return publishTotal - ntaTotal;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

