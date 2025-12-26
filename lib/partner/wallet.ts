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
  creditUsed: number;
  availableBalance: number; // balance + (creditLimit - creditUsed)
};

export type WalletTransaction = {
  id: string;
  type: 'topup' | 'booking_debit' | 'refund_credit' | 'adjustment' | 'credit_repayment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  creditUsedBefore?: number;
  creditUsedAfter?: number;
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
    .select('balance, credit_limit, credit_used')
    .eq('mitra_id', mitraId)
    .single();

  if (error) {
    logger.error('Failed to get wallet balance', error);
    return null;
  }

  const balance = Number(data.balance || 0);
  const creditLimit = Number(data.credit_limit || 0);
  const creditUsed = Number(data.credit_used || 0);
  const availableBalance = balance + (creditLimit - creditUsed);

  return {
    balance,
    creditLimit,
    creditUsed,
    availableBalance,
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
      credit_used_before,
      credit_used_after,
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
    creditUsedBefore: t.credit_used_before ? Number(t.credit_used_before) : undefined,
    creditUsedAfter: t.credit_used_after ? Number(t.credit_used_after) : undefined,
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

  // TODO: Emit wallet.balance_changed event via API endpoint
  // Event emission disabled to avoid server-only import in client components
  // Should be moved to server-side API endpoint

  return { success: true };
}

/**
 * Repay credit limit that has been used
 */
export async function repayCreditLimit(
  mitraId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  const supabase = createClient();

  try {
    // Get wallet ID
    const { data: wallet, error: walletError } = await supabase
      .from('mitra_wallets')
      .select('id, credit_used')
      .eq('mitra_id', mitraId)
      .single();

    if (walletError || !wallet) {
      logger.error('Failed to get wallet for credit repayment', walletError);
      return { success: false, message: 'Wallet tidak ditemukan.' };
    }

    const creditUsed = Number(wallet.credit_used || 0);
    if (creditUsed <= 0) {
      return { success: false, message: 'Tidak ada credit yang perlu dibayar.' };
    }

    if (amount > creditUsed) {
      return { success: false, message: `Jumlah pembayaran melebihi credit yang digunakan (${formatCurrency(creditUsed)}).` };
    }

    // Call database function to process repayment
    const { data: transactionId, error: rpcError } = await supabase.rpc('process_credit_repayment', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_description: description || 'Credit limit repayment',
    });

    if (rpcError || !transactionId) {
      logger.error('Failed to process credit repayment', rpcError);
      return { success: false, message: 'Gagal memproses pembayaran credit.' };
    }

    return {
      success: true,
      message: 'Pembayaran credit berhasil.',
      transactionId: transactionId as string,
    };
  } catch (error) {
    logger.error('Credit repayment error', error);
    return { success: false, message: 'Terjadi kesalahan saat memproses pembayaran.' };
  }
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
