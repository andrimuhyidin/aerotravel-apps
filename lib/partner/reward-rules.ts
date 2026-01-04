/**
 * Partner Reward Rules Configuration
 * Define earning and redemption rules for partner agents
 *
 * Values are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

export type RewardSourceType =
  | 'earn_booking'
  | 'earn_referral'
  | 'earn_milestone'
  | 'earn_special'
  | 'manual';

export type MilestoneType =
  | 'bookings_10'
  | 'bookings_50'
  | 'bookings_100'
  | 'bookings_500'
  | 'bookings_1000'
  | 'revenue_10m'
  | 'revenue_50m'
  | 'revenue_100m'
  | 'revenue_500m';

export interface MilestoneConfig {
  type: MilestoneType;
  label: string;
  value: number;
  points: number;
  description: string;
}

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

const DEFAULT_REFERRAL_POINTS = 1000;
const DEFAULT_POINTS_PER_10K = 1;
const DEFAULT_MIN_REDEMPTION_POINTS = 100;
const DEFAULT_POINTS_EXPIRATION_MONTHS = 12;

const DEFAULT_MILESTONE_CONFIGS: MilestoneConfig[] = [
  {
    type: 'bookings_10',
    label: '10 Bookings',
    value: 10,
    points: 500,
    description: 'Mencapai 10 bookings',
  },
  {
    type: 'bookings_50',
    label: '50 Bookings',
    value: 50,
    points: 2500,
    description: 'Mencapai 50 bookings',
  },
  {
    type: 'bookings_100',
    label: '100 Bookings',
    value: 100,
    points: 5000,
    description: 'Mencapai 100 bookings',
  },
  {
    type: 'bookings_500',
    label: '500 Bookings',
    value: 500,
    points: 25000,
    description: 'Mencapai 500 bookings',
  },
  {
    type: 'bookings_1000',
    label: '1000 Bookings',
    value: 1000,
    points: 50000,
    description: 'Mencapai 1000 bookings',
  },
  {
    type: 'revenue_10m',
    label: 'Revenue Rp 10M',
    value: 10_000_000,
    points: 1000,
    description: 'Total revenue mencapai Rp 10 juta',
  },
  {
    type: 'revenue_50m',
    label: 'Revenue Rp 50M',
    value: 50_000_000,
    points: 5000,
    description: 'Total revenue mencapai Rp 50 juta',
  },
  {
    type: 'revenue_100m',
    label: 'Revenue Rp 100M',
    value: 100_000_000,
    points: 10000,
    description: 'Total revenue mencapai Rp 100 juta',
  },
  {
    type: 'revenue_500m',
    label: 'Revenue Rp 500M',
    value: 500_000_000,
    points: 50000,
    description: 'Total revenue mencapai Rp 500 juta',
  },
];

// ============================================
// SETTINGS FETCHER (with caching)
// ============================================

interface PartnerRewardSettings {
  referralPoints: number;
  pointsPer10k: number;
  minRedemptionPoints: number;
  pointsExpirationMonths: number;
  milestoneConfigs: MilestoneConfig[];
}

/**
 * Get partner reward settings from database with fallback to defaults
 */
async function getPartnerRewardSettings(): Promise<PartnerRewardSettings> {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [
      referralPoints,
      pointsPer10k,
      minRedemptionPoints,
      pointsExpirationMonths,
      milestoneConfigs,
    ] = await Promise.all([
      getSetting('partner_rewards.referral_points'),
      getSetting('partner_rewards.points_per_10k'),
      getSetting('partner_rewards.min_redemption_points'),
      getSetting('partner_rewards.points_expiration_months'),
      getSetting('partner_rewards.milestone_configs'),
    ]);

    return {
      referralPoints: (referralPoints as number) || DEFAULT_REFERRAL_POINTS,
      pointsPer10k: (pointsPer10k as number) || DEFAULT_POINTS_PER_10K,
      minRedemptionPoints:
        (minRedemptionPoints as number) || DEFAULT_MIN_REDEMPTION_POINTS,
      pointsExpirationMonths:
        (pointsExpirationMonths as number) || DEFAULT_POINTS_EXPIRATION_MONTHS,
      milestoneConfigs:
        (milestoneConfigs as MilestoneConfig[]) || DEFAULT_MILESTONE_CONFIGS,
    };
  } catch {
    return {
      referralPoints: DEFAULT_REFERRAL_POINTS,
      pointsPer10k: DEFAULT_POINTS_PER_10K,
      minRedemptionPoints: DEFAULT_MIN_REDEMPTION_POINTS,
      pointsExpirationMonths: DEFAULT_POINTS_EXPIRATION_MONTHS,
      milestoneConfigs: DEFAULT_MILESTONE_CONFIGS,
    };
  }
}

// ============================================
// SYNC EXPORTS (for backward compatibility)
// ============================================

/**
 * Points earned per referral (default, use async version for dynamic)
 * @deprecated Use getReferralPoints() for dynamic values
 */
export const REFERRAL_POINTS = DEFAULT_REFERRAL_POINTS;

/**
 * Milestone configurations (default, use async version for dynamic)
 * @deprecated Use getMilestoneConfigs() for dynamic values
 */
export const MILESTONE_CONFIGS: MilestoneConfig[] = DEFAULT_MILESTONE_CONFIGS;

/**
 * Minimum redemption amount (default, use async version for dynamic)
 * @deprecated Use getMinRedemptionPoints() for dynamic values
 */
export const MIN_REDEMPTION_POINTS = DEFAULT_MIN_REDEMPTION_POINTS;

/**
 * Points expiration period in months (default, use async version for dynamic)
 * @deprecated Use getPointsExpirationMonths() for dynamic values
 */
export const POINTS_EXPIRATION_MONTHS = DEFAULT_POINTS_EXPIRATION_MONTHS;

// ============================================
// ASYNC FUNCTIONS (use these for dynamic values)
// ============================================

/**
 * Get referral points from settings
 */
export async function getReferralPoints(): Promise<number> {
  const settings = await getPartnerRewardSettings();
  return settings.referralPoints;
}

/**
 * Get minimum redemption points from settings
 */
export async function getMinRedemptionPoints(): Promise<number> {
  const settings = await getPartnerRewardSettings();
  return settings.minRedemptionPoints;
}

/**
 * Get points expiration period from settings
 */
export async function getPointsExpirationMonths(): Promise<number> {
  const settings = await getPartnerRewardSettings();
  return settings.pointsExpirationMonths;
}

/**
 * Get milestone configurations from settings
 */
export async function getMilestoneConfigs(): Promise<MilestoneConfig[]> {
  const settings = await getPartnerRewardSettings();
  return settings.milestoneConfigs;
}

/**
 * Calculate points earned from booking
 * Rule: configurable points per Rp 10,000 booking value (NTA)
 */
export async function calculateBookingPointsAsync(
  bookingValue: number
): Promise<number> {
  const settings = await getPartnerRewardSettings();
  return Math.floor(bookingValue / 10_000) * settings.pointsPer10k;
}

/**
 * Calculate points earned from booking (sync version for backward compatibility)
 * @deprecated Use calculateBookingPointsAsync() for dynamic values
 */
export function calculateBookingPoints(bookingValue: number): number {
  return Math.floor(bookingValue / 10_000) * DEFAULT_POINTS_PER_10K;
}

/**
 * Get milestone config by type (async)
 */
export async function getMilestoneConfigAsync(
  type: MilestoneType
): Promise<MilestoneConfig | undefined> {
  const configs = await getMilestoneConfigs();
  return configs.find((m) => m.type === type);
}

/**
 * Get milestone config by type (sync, uses defaults)
 * @deprecated Use getMilestoneConfigAsync() for dynamic values
 */
export function getMilestoneConfig(
  type: MilestoneType
): MilestoneConfig | undefined {
  return DEFAULT_MILESTONE_CONFIGS.find((m) => m.type === type);
}

/**
 * Points to discount conversion
 * Rule: 1 point = Rp 1 discount
 */
export function pointsToDiscount(points: number): number {
  return points;
}

/**
 * Discount to points conversion (for redemption)
 */
export function discountToPoints(discount: number): number {
  return discount;
}

/**
 * Check if milestone type is booking-based
 */
export function isBookingMilestone(type: MilestoneType): boolean {
  return type.startsWith('bookings_');
}

/**
 * Check if milestone type is revenue-based
 */
export function isRevenueMilestone(type: MilestoneType): boolean {
  return type.startsWith('revenue_');
}

/**
 * Get all partner reward settings (for admin display)
 */
export async function getAllPartnerRewardSettings(): Promise<PartnerRewardSettings> {
  return getPartnerRewardSettings();
}

