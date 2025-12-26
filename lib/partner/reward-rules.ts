/**
 * Partner Reward Rules Configuration
 * Define earning and redemption rules for partner agents
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

/**
 * Calculate points earned from booking
 * Rule: 1 point per Rp 10,000 booking value (NTA)
 */
export function calculateBookingPoints(bookingValue: number): number {
  return Math.floor(bookingValue / 10_000);
}

/**
 * Points earned per referral
 */
export const REFERRAL_POINTS = 1000;

/**
 * Milestone configurations
 */
export const MILESTONE_CONFIGS: MilestoneConfig[] = [
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

/**
 * Get milestone config by type
 */
export function getMilestoneConfig(type: MilestoneType): MilestoneConfig | undefined {
  return MILESTONE_CONFIGS.find((m) => m.type === type);
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
 * Minimum redemption amount (in points)
 */
export const MIN_REDEMPTION_POINTS = 100;

/**
 * Points expiration period (in months)
 */
export const POINTS_EXPIRATION_MONTHS = 12;

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

