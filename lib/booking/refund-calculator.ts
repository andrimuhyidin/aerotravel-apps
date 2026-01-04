/**
 * Refund Calculator
 * Calculate refund amount based on cancellation policy
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type CancellationPolicy = {
  id: string;
  name: string;
  description: string | null;
  days_before_trip: number;
  refund_percentage: number;
};

export type RefundCalculation = {
  originalAmount: number;
  refundAmount: number;
  refundPercentage: number;
  daysBeforeTrip: number;
  appliedPolicy: CancellationPolicy;
  deductionAmount: number;
  deductionReason: string;
};

/**
 * Calculate days between two dates
 */
function calculateDaysBetween(fromDate: Date, toDate: Date): number {
  const diffTime = toDate.getTime() - fromDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get applicable cancellation policy based on days before trip
 */
export async function getApplicablePolicy(
  daysBeforeTrip: number
): Promise<CancellationPolicy | null> {
  const supabase = await createAdminClient();

  const { data: policies, error } = await supabase
    .from('cancellation_policies')
    .select('*')
    .eq('is_active', true)
    .order('days_before_trip', { ascending: false });

  if (error || !policies || policies.length === 0) {
    logger.error('Failed to fetch cancellation policies', error);
    return null;
  }

  // Find the applicable policy (first one where days_before_trip <= actual days)
  for (const policy of policies) {
    if (daysBeforeTrip >= policy.days_before_trip) {
      return policy as CancellationPolicy;
    }
  }

  // Return lowest threshold policy (usually 0% refund)
  return policies[policies.length - 1] as CancellationPolicy;
}

/**
 * Calculate refund amount for a booking
 * 
 * @param bookingAmount - Total booking amount
 * @param tripDate - Date of the trip
 * @param cancellationDate - Date of cancellation (defaults to now)
 * @returns RefundCalculation with detailed breakdown
 */
export async function calculateRefund(
  bookingAmount: number,
  tripDate: Date | string,
  cancellationDate: Date = new Date()
): Promise<RefundCalculation | null> {
  const tripDateObj = typeof tripDate === 'string' ? new Date(tripDate) : tripDate;
  const daysBeforeTrip = calculateDaysBetween(cancellationDate, tripDateObj);

  // If trip date has passed, no refund
  if (daysBeforeTrip < 0) {
    return {
      originalAmount: bookingAmount,
      refundAmount: 0,
      refundPercentage: 0,
      daysBeforeTrip,
      appliedPolicy: {
        id: 'expired',
        name: 'Trip Date Passed',
        description: 'Trip sudah melewati tanggal yang dijadwalkan',
        days_before_trip: 0,
        refund_percentage: 0,
      },
      deductionAmount: bookingAmount,
      deductionReason: 'Trip sudah melewati tanggal yang dijadwalkan - tidak ada refund',
    };
  }

  const policy = await getApplicablePolicy(daysBeforeTrip);

  if (!policy) {
    logger.warn('No cancellation policy found');
    return null;
  }

  const refundPercentage = policy.refund_percentage;
  const refundAmount = Math.round((bookingAmount * refundPercentage) / 100);
  const deductionAmount = bookingAmount - refundAmount;

  let deductionReason = '';
  if (refundPercentage === 100) {
    deductionReason = 'Refund penuh tanpa potongan';
  } else if (refundPercentage === 0) {
    deductionReason = `Pembatalan kurang dari ${policy.days_before_trip + 1} hari - tidak ada refund`;
  } else {
    deductionReason = `Potongan ${100 - refundPercentage}% sesuai kebijakan pembatalan`;
  }

  return {
    originalAmount: bookingAmount,
    refundAmount,
    refundPercentage,
    daysBeforeTrip,
    appliedPolicy: policy,
    deductionAmount,
    deductionReason,
  };
}

/**
 * Get all cancellation policies (for display)
 */
export async function getAllPolicies(): Promise<CancellationPolicy[]> {
  const supabase = await createAdminClient();

  const { data: policies, error } = await supabase
    .from('cancellation_policies')
    .select('*')
    .eq('is_active', true)
    .order('days_before_trip', { ascending: false });

  if (error) {
    logger.error('Failed to fetch cancellation policies', error);
    return [];
  }

  return (policies || []) as CancellationPolicy[];
}

/**
 * Format refund calculation for display
 */
export function formatRefundSummary(calculation: RefundCalculation): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  return [
    `Original: ${formatCurrency(calculation.originalAmount)}`,
    `Refund: ${formatCurrency(calculation.refundAmount)} (${calculation.refundPercentage}%)`,
    `Policy: ${calculation.appliedPolicy.name}`,
    `Days before trip: ${calculation.daysBeforeTrip}`,
  ].join('\n');
}

