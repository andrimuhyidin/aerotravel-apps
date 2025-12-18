/**
 * API: Guide Wallet
 * GET  /api/guide/wallet  - current balance + recent transactions + salary overview
 * POST /api/guide/wallet  - create withdraw request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const withdrawSchema = z.object({
  amount: z.number().positive(),
  quickAction: z.enum(['all', 'half', 'preset']).optional(),
  presetAmount: z.number().optional(),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  const { data: walletRow, error: walletError } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', user.id)
    .maybeSingle();
  if (walletError) {
    logger.error('Failed to load guide_wallet', walletError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 });
  }

  const balance = Number(walletRow?.balance ?? 0);
  const walletId = walletRow?.id ?? null;

  let transactions: unknown[] = [];
  if (walletId) {
    const { data: txData, error: txError } = await client
      .from('guide_wallet_transactions')
      .select('id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (txError) {
      logger.error('Failed to load wallet transactions', txError, { walletId });
      return NextResponse.json(
        { error: 'Failed to load wallet transactions' },
        { status: 500 },
      );
    }
    transactions = txData ?? [];
  }

  // Salary overview (ready vs pending)
  const { data: salaryData, error: salaryError } = await client
    .from('salary_payments')
    .select('id, period_start, period_end, net_amount, status, all_docs_uploaded')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (salaryError) {
    logger.error('Failed to load salary overview', salaryError, { guideId: user.id });
  }

  return NextResponse.json({
    balance,
    transactions,
    salary: salaryData ?? [],
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as unknown;

  let parsed;
  try {
    parsed = withdrawSchema.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  let amount = parsed.amount;
  const quickAction = parsed.quickAction;
  const presetAmount = parsed.presetAmount;

  const client = supabase as unknown as any;

  // Ensure wallet exists
  let { data: walletRow, error: walletError } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (walletError) {
    logger.error('Failed to load guide_wallet', walletError, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 });
  }

  if (!walletRow) {
    const { data: newWallet, error: insertError } = await client
      .from('guide_wallets')
      .insert({ guide_id: user.id, balance: 0 })
      .select('id, balance')
      .single();

    if (insertError) {
      logger.error('Failed to create guide_wallet', insertError, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to init wallet' }, { status: 500 });
    }

    walletRow = newWallet;
  }

  const walletId = walletRow.id as string;
  const currentBalance = Number(walletRow.balance ?? 0);

  // Handle quick actions
  if (quickAction === 'all') {
    amount = currentBalance;
  } else if (quickAction === 'half') {
    amount = Math.floor(currentBalance / 2);
  } else if (quickAction === 'preset' && presetAmount) {
    amount = presetAmount;
  }

  // Minimum withdraw amount
  const minWithdraw = 50000;
  if (amount < minWithdraw) {
    return NextResponse.json(
      { error: `Minimum penarikan adalah Rp ${minWithdraw.toLocaleString('id-ID')}` },
      { status: 400 },
    );
  }

  if (amount > currentBalance) {
    return NextResponse.json(
      { error: 'Jumlah melebihi saldo yang tersedia' },
      { status: 400 },
    );
  }

  const balanceBefore = currentBalance;
  const balanceAfter = currentBalance; // saldo bisa dikurangi saat approve, bukan saat request

  const { error: txError } = await client.from('guide_wallet_transactions').insert({
    wallet_id: walletId,
    transaction_type: 'withdraw_request',
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_type: 'wallet_withdraw',
    status: 'pending',
    created_by: user.id,
  });

  if (txError) {
    logger.error('Failed to create withdraw_request', txError, {
      guideId: user.id,
      amount,
    });
    return NextResponse.json({ error: 'Failed to create withdraw request' }, { status: 500 });
  }

  logger.info('Guide withdraw request created', { guideId: user.id, amount });

  return NextResponse.json({ success: true });
});
