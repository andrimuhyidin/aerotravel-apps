/**
 * Partner Wallet Service
 * Sesuai PRD 4.3.B - Partner Portal (B2B Ecosystem)
 * 
 * Features:
 * - Get wallet balance
 * - Top-up deposit
 * - Debit for booking
 * - Transaction history
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export type WalletBalance = {
  balance: number;
  creditLimit: number;
  availableBalance: number; // balance + creditLimit
};

export type WalletTransaction = {
  id: string;
  type: 'topup' | 'booking_debit' | 'refund_credit' | 'adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  bookingCode?: string;
  createdAt: string;
};

export type TopupResult = {
  success: boolean;
  paymentUrl?: string;
  message: string;
};

/**
 * Get mitra wallet balance
 */
export async function getWalletBalance(mitraId: string): Promise<WalletBalance | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('mitra_wallets')
    .select('balance, credit_limit')
    .eq('mitra_id', mitraId)
    .single();

  if (error) {
    logger.error('Failed to get wallet balance', error);
    return null;
  }

  return {
    balance: Number(data.balance),
    creditLimit: Number(data.credit_limit),
    availableBalance: Number(data.balance) + Number(data.credit_limit),
  };
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  mitraId: string,
  limit: number = 20,
  offset: number = 0
): Promise<WalletTransaction[]> {
  const supabase = createClient();

  // First get wallet ID
  const { data: wallet } = await supabase
    .from('mitra_wallets')
    .select('id')
    .eq('mitra_id', mitraId)
    .single();

  if (!wallet) return [];

  const { data, error } = await supabase
    .from('mitra_wallet_transactions')
    .select(`
      id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description,
      booking:bookings(booking_code),
      created_at
    `)
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to get wallet transactions', error);
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    type: t.transaction_type as WalletTransaction['type'],
    amount: Number(t.amount),
    balanceBefore: Number(t.balance_before),
    balanceAfter: Number(t.balance_after),
    description: t.description ?? undefined,
    bookingCode: t.booking?.booking_code ?? undefined,
    createdAt: t.created_at || new Date().toISOString(),
  }));
}

/**
 * Create top-up request
 */
export async function createTopupRequest(
  mitraId: string,
  amount: number
): Promise<TopupResult> {
  try {
    // Call API to create Xendit invoice
    const response = await fetch('/api/partner/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mitraId, amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to create topup request');
    }

    const data = await response.json();

    return {
      success: true,
      paymentUrl: data.paymentUrl,
      message: 'Silakan lakukan pembayaran.',
    };
  } catch (error) {
    logger.error('Create topup failed', error);
    return {
      success: false,
      message: 'Gagal membuat request top-up.',
    };
  }
}

/**
 * Debit wallet for booking (internal use)
 */
export async function debitWalletForBooking(
  mitraId: string,
  bookingId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  // Get current balance
  const balance = await getWalletBalance(mitraId);
  if (!balance) {
    return { success: false, message: 'Wallet tidak ditemukan.' };
  }

  if (amount > balance.availableBalance) {
    return { success: false, message: 'Saldo tidak mencukupi.' };
  }

  // Get wallet ID
  const { data: wallet } = await supabase
    .from('mitra_wallets')
    .select('id')
    .eq('mitra_id', mitraId)
    .single();

  if (!wallet) {
    return { success: false, message: 'Wallet tidak ditemukan.' };
  }

  // Create transaction and update balance
  const newBalance = balance.balance - amount;

  const { error: txError } = await supabase
    .from('mitra_wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      transaction_type: 'booking_debit',
      amount: -amount,
      balance_before: balance.balance,
      balance_after: newBalance,
      booking_id: bookingId,
      description: 'Pembayaran booking',
    });

  if (txError) {
    logger.error('Create wallet transaction failed', txError);
    return { success: false, message: 'Gagal mencatat transaksi.' };
  }

  const { error: updateError } = await supabase
    .from('mitra_wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id);

  if (updateError) {
    logger.error('Update wallet balance failed', updateError);
    return { success: false, message: 'Gagal update saldo.' };
  }

  return { success: true, message: 'Pembayaran berhasil.' };
}

/**
 * Credit wallet (for refund or topup webhook)
 */
export async function creditWallet(
  mitraId: string,
  amount: number,
  type: 'topup' | 'refund_credit',
  description: string,
  bookingId?: string
): Promise<{ success: boolean }> {
  const supabase = createClient();

  const balance = await getWalletBalance(mitraId);
  if (!balance) return { success: false };

  const { data: wallet } = await supabase
    .from('mitra_wallets')
    .select('id')
    .eq('mitra_id', mitraId)
    .single();

  if (!wallet) return { success: false };

  const newBalance = balance.balance + amount;

  await supabase.from('mitra_wallet_transactions').insert({
    wallet_id: wallet.id,
    transaction_type: type,
    amount: amount,
    balance_before: balance.balance,
    balance_after: newBalance,
    booking_id: bookingId,
    description,
  });

  await supabase
    .from('mitra_wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id);

  return { success: true };
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
