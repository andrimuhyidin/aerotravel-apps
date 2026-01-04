/**
 * Wallet Utilities
 * PRD 4.3.B: Deposit System - Auto-confirmation for wallet payments
 */

export type PaymentMethod = 'wallet' | 'midtrans' | 'bank_transfer';
export type BookingStatus = 'draft' | 'pending_payment' | 'confirmed' | 'paid' | 'cancelled';

/**
 * Calculate available balance including credit limit
 * @param balance Current wallet balance
 * @param creditLimit Credit limit for the partner
 * @returns Total available balance
 */
export function calculateAvailableBalance(balance: number, creditLimit: number = 0): number {
  return balance + creditLimit;
}

/**
 * Check if wallet has sufficient balance for transaction
 * @param availableBalance Total available balance
 * @param amount Amount to debit
 * @returns Whether debit is possible
 */
export function canDebit(availableBalance: number, amount: number): boolean {
  return availableBalance >= amount;
}

/**
 * Determine booking status based on payment method and draft flag
 * PRD: "Status langsung CONFIRMED tanpa menunggu verifikasi manual admin"
 * 
 * @param paymentMethod Payment method selected
 * @param isDraft Whether this is a draft booking
 * @returns Booking status
 */
export function determineBookingStatus(
  paymentMethod: PaymentMethod,
  isDraft: boolean
): BookingStatus {
  if (isDraft) {
    return 'draft';
  }

  // PRD 4.3.B: Wallet payment = auto-confirmed
  if (paymentMethod === 'wallet') {
    return 'confirmed';
  }

  // Other payment methods require payment confirmation
  return 'pending_payment';
}

/**
 * Validate wallet balance before booking
 * @param balance Current wallet balance
 * @param creditLimit Credit limit
 * @param amount Amount needed for booking
 * @returns Validation result
 */
export function validateWalletBalance(
  balance: number,
  creditLimit: number,
  amount: number
): {
  isValid: boolean;
  availableBalance: number;
  shortfall: number;
  message: string;
} {
  const availableBalance = calculateAvailableBalance(balance, creditLimit);
  const isValid = canDebit(availableBalance, amount);
  const shortfall = isValid ? 0 : amount - availableBalance;

  let message: string;
  if (isValid) {
    message = 'Saldo mencukupi untuk transaksi';
  } else {
    message = `Saldo tidak mencukupi. Diperlukan ${amount.toLocaleString('id-ID')}, tersedia ${availableBalance.toLocaleString('id-ID')}`;
  }

  return {
    isValid,
    availableBalance,
    shortfall,
    message,
  };
}

/**
 * Calculate new balance after debit
 * @param currentBalance Current balance
 * @param amount Amount to debit
 * @returns New balance
 */
export function calculateBalanceAfterDebit(currentBalance: number, amount: number): number {
  return Math.max(0, currentBalance - amount);
}

/**
 * Calculate refund amount for wallet
 * @param originalAmount Original transaction amount
 * @param refundPercentage Refund percentage (0-100)
 * @returns Refund amount
 */
export function calculateWalletRefund(originalAmount: number, refundPercentage: number): number {
  return Math.round(originalAmount * (refundPercentage / 100));
}

