/**
 * Wallet Bonus Calculation Utilities
 * Calculate performance-based bonuses for guide earnings
 *
 * Values are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

export type BonusCalculation = {
  baseFee: number;
  ratingBonus: number;
  onTimeBonus: number;
  documentationBonus: number;
  guestCountBonus: number;
  totalBonus: number;
  penalties: number;
  netEarning: number;
};

export type BonusConfig = {
  rating5Percent: number; // Default: 10%
  rating4Percent: number; // Default: 5%
  onTimeBonusAmount: number; // Default: 50000
  documentationBonusAmount: number; // Default: 100000
  guestCountBonusPerPax: number; // Default: 10000
  guestCountTarget: number; // Default: 0 (no target)
  rewardPointsPercentage: number; // Default: 10%
};

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

const DEFAULT_CONFIG: BonusConfig = {
  rating5Percent: 0.1,
  rating4Percent: 0.05,
  onTimeBonusAmount: 50000,
  documentationBonusAmount: 100000,
  guestCountBonusPerPax: 10000,
  guestCountTarget: 0,
  rewardPointsPercentage: 0.1,
};

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Get guide bonus settings from database with fallback to defaults
 */
export async function getGuideBonusSettings(): Promise<BonusConfig> {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [
      rating5Percent,
      rating4Percent,
      onTimeBonus,
      documentationBonus,
      guestCountBonusPerPax,
      rewardPointsPercentage,
    ] = await Promise.all([
      getSetting('guide_bonus.rating_5_percent'),
      getSetting('guide_bonus.rating_4_percent'),
      getSetting('guide_bonus.on_time_bonus'),
      getSetting('guide_bonus.documentation_bonus'),
      getSetting('guide_bonus.guest_count_bonus_per_pax'),
      getSetting('guide_bonus.reward_points_percentage'),
    ]);

    return {
      rating5Percent: (rating5Percent as number) || DEFAULT_CONFIG.rating5Percent,
      rating4Percent: (rating4Percent as number) || DEFAULT_CONFIG.rating4Percent,
      onTimeBonusAmount:
        (onTimeBonus as number) || DEFAULT_CONFIG.onTimeBonusAmount,
      documentationBonusAmount:
        (documentationBonus as number) || DEFAULT_CONFIG.documentationBonusAmount,
      guestCountBonusPerPax:
        (guestCountBonusPerPax as number) || DEFAULT_CONFIG.guestCountBonusPerPax,
      guestCountTarget: DEFAULT_CONFIG.guestCountTarget, // This is per-trip, not global setting
      rewardPointsPercentage:
        (rewardPointsPercentage as number) || DEFAULT_CONFIG.rewardPointsPercentage,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ============================================
// ASYNC FUNCTIONS (use these for dynamic values)
// ============================================

/**
 * Calculate bonus for a trip (async - uses dynamic settings)
 * Returns bonus calculation and reward points to award
 */
export async function calculateTripBonusAsync(
  baseFee: number,
  rating: number | null,
  isLate: boolean,
  documentationUploaded: boolean,
  guestCount: number = 0,
  guestCountTarget: number = 0,
  configOverride: Partial<BonusConfig> = {}
): Promise<BonusCalculation & { rewardPoints: number }> {
  const settingsConfig = await getGuideBonusSettings();
  const finalConfig = { ...settingsConfig, guestCountTarget, ...configOverride };

  let ratingBonus = 0;
  if (rating === 5) {
    ratingBonus = baseFee * finalConfig.rating5Percent;
  } else if (rating === 4) {
    ratingBonus = baseFee * finalConfig.rating4Percent;
  }

  const onTimeBonus = !isLate ? finalConfig.onTimeBonusAmount : 0;
  const documentationBonus = documentationUploaded
    ? finalConfig.documentationBonusAmount
    : 0;

  let guestCountBonus = 0;
  if (guestCountTarget > 0 && guestCount > guestCountTarget) {
    guestCountBonus =
      (guestCount - guestCountTarget) * finalConfig.guestCountBonusPerPax;
  }

  const totalBonus = ratingBonus + onTimeBonus + documentationBonus + guestCountBonus;

  // Calculate reward points using configurable percentage
  const rewardPoints = Math.floor(totalBonus * finalConfig.rewardPointsPercentage);

  return {
    baseFee,
    ratingBonus,
    onTimeBonus,
    documentationBonus,
    guestCountBonus,
    totalBonus,
    penalties: 0, // Penalties calculated separately
    netEarning: baseFee + totalBonus,
    rewardPoints,
  };
}

// ============================================
// SYNC FUNCTIONS (for backward compatibility)
// ============================================

/**
 * Calculate bonus for a trip (sync - uses default config)
 * Returns bonus calculation and reward points to award (10% of bonus amount)
 * @deprecated Use calculateTripBonusAsync() for dynamic values
 */
export function calculateTripBonus(
  baseFee: number,
  rating: number | null,
  isLate: boolean,
  documentationUploaded: boolean,
  guestCount: number = 0,
  guestCountTarget: number = 0,
  config: Partial<BonusConfig> = {}
): BonusCalculation & { rewardPoints: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  let ratingBonus = 0;
  if (rating === 5) {
    ratingBonus = baseFee * finalConfig.rating5Percent;
  } else if (rating === 4) {
    ratingBonus = baseFee * finalConfig.rating4Percent;
  }

  const onTimeBonus = !isLate ? finalConfig.onTimeBonusAmount : 0;
  const documentationBonus = documentationUploaded
    ? finalConfig.documentationBonusAmount
    : 0;

  let guestCountBonus = 0;
  if (guestCountTarget > 0 && guestCount > guestCountTarget) {
    guestCountBonus =
      (guestCount - guestCountTarget) * finalConfig.guestCountBonusPerPax;
  }

  const totalBonus = ratingBonus + onTimeBonus + documentationBonus + guestCountBonus;

  // Calculate reward points (10% of bonus amount)
  const rewardPoints = Math.floor(totalBonus * finalConfig.rewardPointsPercentage);

  return {
    baseFee,
    ratingBonus,
    onTimeBonus,
    documentationBonus,
    guestCountBonus,
    totalBonus,
    penalties: 0, // Penalties calculated separately
    netEarning: baseFee + totalBonus,
    rewardPoints,
  };
}

/**
 * Calculate net earning with penalties
 */
export function calculateNetEarning(
  bonusCalculation: BonusCalculation,
  penalties: number
): number {
  return bonusCalculation.netEarning - penalties;
}

/**
 * Get all guide bonus settings (for admin display)
 */
export async function getAllGuideBonusSettings(): Promise<BonusConfig> {
  return getGuideBonusSettings();
}

