/**
 * API: Admin Guide Wallet Withdraw Management
 * GET  /api/admin/guide/wallet/withdraw   - list pending withdraw requests
 * POST /api/admin/guide/wallet/withdraw   - approve/reject
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  const { data, error } = await client
    .from('guide_wallet_transactions')
    .select(
      `
      id,
      wallet_id,
      amount,
      status,
      created_at,
      wallet:guide_wallets(
        guide_id,
        balance,
        guide:users(full_name, phone)
      )
    `
    )
    .eq('transaction_type', 'withdraw_request')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to load withdraw requests', error);
    return NextResponse.json({ error: 'Failed to load withdraw requests' }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    action?: 'approve' | 'reject';
  };

  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  const {
    data: tx,
    error: txError,
  } = await client
    .from('guide_wallet_transactions')
    .select('id, wallet_id, amount, status')
    .eq('id', id)
    .maybeSingle();

  if (txError || !tx) {
    logger.error('Withdraw request not found', txError, { id });
    return NextResponse.json({ error: 'Withdraw request not found' }, { status: 404 });
  }

  if (tx.status !== 'pending') {
    return NextResponse.json({ error: 'Withdraw request is not pending' }, { status: 400 });
  }

  if (action === 'reject') {
    const { error: updateError } = await client
      .from('guide_wallet_transactions')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to reject withdraw request', updateError, { id });
      return NextResponse.json({ error: 'Failed to update withdraw request' }, { status: 500 });
    }

    logger.info('Withdraw request rejected', { id });
    return NextResponse.json({ success: true });
  }

  // Approve: deduct balance and mark transaction
  const {
    data: wallet,
    error: walletError,
  } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('id', tx.wallet_id)
    .maybeSingle();

  if (walletError || !wallet) {
    logger.error('Wallet not found for withdraw request', walletError, { walletId: tx.wallet_id });
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const currentBalance = Number(wallet.balance ?? 0);
  const amount = Number(tx.amount ?? 0);

  if (amount > currentBalance) {
    return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
  }

  const balanceBefore = currentBalance;
  const balanceAfter = currentBalance - amount;

  const { error: balanceError } = await client
    .from('guide_wallets')
    .update({ balance: balanceAfter })
    .eq('id', wallet.id);

  if (balanceError) {
    logger.error('Failed to update guide_wallet balance', balanceError, { walletId: wallet.id });
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }

  const { error: updateTxError } = await client
    .from('guide_wallet_transactions')
    .update({
      status: 'approved',
      transaction_type: 'withdraw_approved',
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    })
    .eq('id', id);

  if (updateTxError) {
    logger.error('Failed to mark withdraw as approved', updateTxError, { id });
    return NextResponse.json({ error: 'Failed to update withdraw request' }, { status: 500 });
  }

  logger.info('Withdraw request approved', { id, amount });

  return NextResponse.json({ success: true });
});
