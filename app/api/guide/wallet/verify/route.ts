/**
 * API: Guide Wallet Balance Verification
 * GET /api/guide/wallet/verify - Verify balance consistency
 * POST /api/guide/wallet/verify - Recalculate and sync balance
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Calculate balance from transactions
 */
async function calculateBalanceFromTransactions(walletId: string, client: any): Promise<number> {
  const { data: transactions, error } = await client
    .from('guide_wallet_transactions')
    .select('transaction_type, amount, status')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch transactions for balance calculation', error, { walletId });
    return 0;
  }

  let calculatedBalance = 0;

  for (const tx of transactions || []) {
    const amount = Number(tx.amount || 0);
    const type = tx.transaction_type as string;
    const status = tx.status as string | null;

    // Only count approved withdrawals or non-withdrawal transactions
    if (type === 'withdraw_request') {
      // Pending withdraw requests don't affect balance
      if (status === 'approved') {
        calculatedBalance -= amount;
      }
    } else if (type === 'withdraw_approved') {
      // Approved withdrawal reduces balance
      calculatedBalance -= amount;
    } else if (type === 'withdraw_rejected') {
      // Rejected withdrawal doesn't affect balance
      // Do nothing
    } else if (type === 'earning') {
      // Earnings increase balance
      calculatedBalance += amount;
    } else if (type === 'adjustment') {
      // Adjustments can be positive or negative
      calculatedBalance += amount;
    }
  }

  return calculatedBalance;
}

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get stored balance
  const { data: wallet, error: walletError } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (walletError) {
    logger.error('Failed to load wallet', walletError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 });
  }

  if (!wallet) {
    return NextResponse.json({
      storedBalance: 0,
      calculatedBalance: 0,
      difference: 0,
      isConsistent: true,
      message: 'Wallet not found',
    });
  }

  const storedBalance = Number(wallet.balance || 0);
  const calculatedBalance = await calculateBalanceFromTransactions(wallet.id, client);
  const difference = storedBalance - calculatedBalance;
  const isConsistent = Math.abs(difference) < 0.01; // Allow small floating point differences

  // Get transaction summary
  const { data: txSummary } = await client
    .from('guide_wallet_transactions')
    .select('transaction_type, amount, status')
    .eq('wallet_id', wallet.id);

  const summary = {
    totalEarnings: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalAdjustments: 0,
  };

  for (const tx of txSummary || []) {
    const amount = Number(tx.amount || 0);
    const type = tx.transaction_type as string;
    const status = tx.status as string | null;

    if (type === 'earning') {
      summary.totalEarnings += amount;
    } else if (type === 'withdraw_request' || type === 'withdraw_approved') {
      if (status === 'pending') {
        summary.pendingWithdrawals += amount;
      } else if (status === 'approved') {
        summary.totalWithdrawals += amount;
      }
    } else if (type === 'adjustment') {
      summary.totalAdjustments += amount;
    }
  }

  return NextResponse.json({
    storedBalance,
    calculatedBalance,
    difference,
    isConsistent,
    summary: {
      totalEarnings: summary.totalEarnings,
      totalWithdrawals: summary.totalWithdrawals,
      pendingWithdrawals: summary.pendingWithdrawals,
      totalAdjustments: summary.totalAdjustments,
      expectedBalance: summary.totalEarnings - summary.totalWithdrawals + summary.totalAdjustments,
    },
    message: isConsistent
      ? 'Balance is consistent'
      : `Balance mismatch detected. Difference: Rp ${difference.toLocaleString('id-ID')}`,
  });
});

export const POST = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get wallet
  const { data: wallet, error: walletError } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (walletError || !wallet) {
    logger.error('Failed to load wallet', walletError, { guideId: user.id });
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  // Calculate correct balance
  const calculatedBalance = await calculateBalanceFromTransactions(wallet.id, client);

  // Update stored balance
  const { error: updateError } = await client
    .from('guide_wallets')
    .update({ balance: calculatedBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id);

  if (updateError) {
    logger.error('Failed to update wallet balance', updateError, { walletId: wallet.id });
    return NextResponse.json({ error: 'Failed to sync balance' }, { status: 500 });
  }

  logger.info('Wallet balance synced', {
    guideId: user.id,
    walletId: wallet.id,
    oldBalance: Number(wallet.balance || 0),
    newBalance: calculatedBalance,
  });

  return NextResponse.json({
    success: true,
    message: 'Balance synced successfully',
    oldBalance: Number(wallet.balance || 0),
    newBalance: calculatedBalance,
    difference: calculatedBalance - Number(wallet.balance || 0),
  });
});

