/**
 * Refund Calculator
 * PRD 4.5.C - Auto-Refund Calculator
 * 
 * Policy:
 * - H > 30: Refund 100% (minus admin fee)
 * - H 14-30: Refund 50%
 * - H < 7: Refund 0%
 */


export type RefundCalculation = {
  refundable: boolean;
  refundPercentage: number;
  refundAmount: number;
  originalAmount: number;
  daysUntilTrip: number;
  policy: string;
};

/**
 * Calculate refund amount based on cancellation policy
 * @param tripDate - Trip date (YYYY-MM-DD or Date)
 * @param originalAmount - Original booking amount
 * @param cancellationDate - Date of cancellation (default: today)
 * @returns Refund calculation result
 */
export function calculateRefund(
  tripDate: string | Date,
  originalAmount: number,
  cancellationDate: Date = new Date()
): RefundCalculation {
  const trip = typeof tripDate === 'string' ? new Date(tripDate) : tripDate;
  const cancel = new Date(cancellationDate);
  
  // Set time to midnight for accurate day calculation
  trip.setHours(0, 0, 0, 0);
  cancel.setHours(0, 0, 0, 0);

  const daysUntilTrip = Math.floor((trip.getTime() - cancel.getTime()) / (1000 * 60 * 60 * 24));

  // If trip already passed, no refund
  if (daysUntilTrip < 0) {
    return {
      refundable: false,
      refundPercentage: 0,
      refundAmount: 0,
      originalAmount,
      daysUntilTrip,
      policy: 'Trip sudah berlalu, tidak ada refund',
    };
  }

  // PRD 4.5.C: Apply refund policy
  let refundPercentage = 0;
  let policy = '';
  const adminFee = 50000; // Default admin fee (configurable)

  if (daysUntilTrip > 30) {
    // H > 30: Refund 100% (minus admin fee)
    refundPercentage = 100;
    policy = `H > 30 hari: Refund 100% (minus admin fee Rp ${adminFee.toLocaleString('id-ID')})`;
  } else if (daysUntilTrip >= 14 && daysUntilTrip <= 30) {
    // H 14-30: Refund 50%
    refundPercentage = 50;
    policy = 'H 14-30 hari: Refund 50%';
  } else if (daysUntilTrip >= 7 && daysUntilTrip < 14) {
    // H 7-13: Refund 25% (intermediate)
    refundPercentage = 25;
    policy = 'H 7-13 hari: Refund 25%';
  } else {
    // H < 7: Refund 0%
    refundPercentage = 0;
    policy = 'H < 7 hari: Tidak ada refund (0%)';
  }

  // Calculate refund amount
  let refundAmount = Math.round((originalAmount * refundPercentage) / 100);
  
  // Apply admin fee for H > 30 (full refund)
  if (daysUntilTrip > 30 && refundAmount > adminFee) {
    refundAmount = refundAmount - adminFee;
  }

  return {
    refundable: refundPercentage > 0,
    refundPercentage,
    refundAmount,
    originalAmount,
    daysUntilTrip,
    policy,
  };
}

/**
 * Check if booking can be cancelled
 * @param tripDate - Trip date
 * @param bookingStatus - Current booking status
 * @param cancellationDate - Date of cancellation (default: today)
 * @returns Whether booking can be cancelled
 */
export function canCancelBooking(
  tripDate: string | Date,
  bookingStatus: string,
  cancellationDate: Date = new Date()
): { canCancel: boolean; reason?: string } {
  // Only pending_payment, paid, or confirmed bookings can be cancelled
  const cancellableStatuses = ['pending_payment', 'paid', 'confirmed'];
  
  if (!cancellableStatuses.includes(bookingStatus)) {
    return {
      canCancel: false,
      reason: `Booking dengan status "${bookingStatus}" tidak dapat dibatalkan`,
    };
  }

  const trip = typeof tripDate === 'string' ? new Date(tripDate) : tripDate;
  const cancel = new Date(cancellationDate);
  
  trip.setHours(0, 0, 0, 0);
  cancel.setHours(0, 0, 0, 0);

  const daysUntilTrip = Math.floor((trip.getTime() - cancel.getTime()) / (1000 * 60 * 60 * 24));

  // Can cancel if trip hasn't started yet
  if (daysUntilTrip < 0) {
    return {
      canCancel: false,
      reason: 'Trip sudah berlalu, tidak dapat dibatalkan',
    };
  }

  return { canCancel: true };
}

