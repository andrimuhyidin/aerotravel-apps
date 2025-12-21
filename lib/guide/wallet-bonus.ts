/**
 * Wallet Bonus Calculation Utilities
 * Calculate performance-based bonuses for guide earnings
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
};

const DEFAULT_CONFIG: BonusConfig = {
  rating5Percent: 0.1,
  rating4Percent: 0.05,
  onTimeBonusAmount: 50000,
  documentationBonusAmount: 100000,
  guestCountBonusPerPax: 10000,
  guestCountTarget: 0,
};

/**
 * Calculate bonus for a trip
 * Returns bonus calculation and reward points to award (10% of bonus amount)
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
  const documentationBonus = documentationUploaded ? finalConfig.documentationBonusAmount : 0;

  let guestCountBonus = 0;
  if (guestCountTarget > 0 && guestCount > guestCountTarget) {
    guestCountBonus = (guestCount - guestCountTarget) * finalConfig.guestCountBonusPerPax;
  }

  const totalBonus = ratingBonus + onTimeBonus + documentationBonus + guestCountBonus;
  
  // Calculate reward points (10% of bonus amount)
  const rewardPoints = Math.floor(totalBonus * 0.1);

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

