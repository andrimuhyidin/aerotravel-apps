/**
 * API: Guide Wallet
 * GET  /api/guide/wallet  - current balance + recent transactions + salary overview
 * POST /api/guide/wallet  - create withdraw request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  parsePaginationParams,
  createPaginationMeta,
} from '@/lib/api/pagination';
import { invalidateCache } from '@/lib/cache/redis-cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const withdrawSchema = z.object({
  amount: z.number().positive(),
  quickAction: z.enum(['all', 'half', 'preset']).optional(),
  presetAmount: z.number().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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
    logger.error('Failed to load guide_wallet', walletError, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to load wallet' },
      { status: 500 }
    );
  }

  // Auto-verify and sync balance if wallet exists (background check)
  if (walletRow?.id) {
    try {
      // Calculate balance from transactions
      const { data: calculatedBalance, error: calcError } = await client.rpc(
        'calculate_guide_wallet_balance',
        { p_wallet_id: walletRow.id }
      );

      if (!calcError && calculatedBalance !== null) {
        const storedBalance = Number(walletRow.balance ?? 0);
        const calculated = Number(calculatedBalance ?? 0);
        const difference = Math.abs(storedBalance - calculated);

        // Auto-sync if difference > 0.01 (allow small floating point differences)
        if (difference > 0.01) {
          logger.warn('Balance mismatch detected, auto-syncing', {
            guideId: user.id,
            walletId: walletRow.id,
            storedBalance,
            calculatedBalance: calculated,
            difference,
          });

          // Update balance
          await client
            .from('guide_wallets')
            .update({
              balance: calculated,
              updated_at: new Date().toISOString(),
            })
            .eq('id', walletRow.id);

          // Use calculated balance
          walletRow.balance = calculated;
        }
      }
    } catch (_error) {
      // If RPC function doesn't exist yet (migration not applied), continue with stored balance
      logger.debug('Auto-verification skipped (function may not exist)', {
        guideId: user.id,
      });
    }
  }

  const balance = Number(walletRow?.balance ?? 0);
  const walletId = walletRow?.id ?? null;

  const { searchParams } = new URL(request.url || new URL('http://localhost'));
  // Support legacy tx_limit/tx_offset params or standard page/limit params
  const txLimitParam = searchParams.get('tx_limit');
  const txOffsetParam = searchParams.get('tx_offset');

  let txPage = 1;
  let txLimit = 20;
  let txOffset = 0;

  if (txLimitParam || txOffsetParam) {
    // Legacy offset-based pagination
    txLimit = parseInt(txLimitParam || '20', 10);
    txOffset = parseInt(txOffsetParam || '0', 10);
    txPage = Math.floor(txOffset / txLimit) + 1;
  } else {
    // Standard page-based pagination
    const pagination = parsePaginationParams(searchParams, 20);
    txPage = pagination.page;
    txLimit = pagination.limit;
    txOffset = pagination.offset;
  }

  let transactions: unknown[] = [];
  let transactionsTotal = 0;

  if (walletId) {
    // Get total count
    const { count } = await client
      .from('guide_wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', walletId);

    transactionsTotal = count || 0;

    // Get paginated transactions
    const { data: txData, error: txError } = await client
      .from('guide_wallet_transactions')
      .select(
        'id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at'
      )
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .range(txOffset, txOffset + txLimit - 1);

    if (txError) {
      logger.error('Failed to load wallet transactions', txError, { walletId });
      return NextResponse.json(
        { error: 'Failed to load wallet transactions' },
        { status: 500 }
      );
    }
    transactions = txData ?? [];
  }

  // Salary overview (ready vs pending)
  const { data: salaryData, error: salaryError } = await client
    .from('salary_payments')
    .select(
      'id, period_start, period_end, net_amount, status, all_docs_uploaded'
    )
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (salaryError) {
    logger.error('Failed to load salary overview', salaryError, {
      guideId: user.id,
    });
  }

  return NextResponse.json({
    balance,
    transactions,
    transactionsPagination: createPaginationMeta(
      transactionsTotal,
      txPage,
      txLimit
    ),
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
  const bankAccountId = (body as { bank_account_id?: string }).bank_account_id;
  const quickAction = parsed.quickAction;
  const presetAmount = parsed.presetAmount;

  const client = supabase as unknown as any;

  // Ensure wallet exists
  const { data: walletRowData, error: walletError } = await client
    .from('guide_wallets')
    .select('id, balance')
    .eq('guide_id', user.id)
    .maybeSingle();

  if (walletError) {
    logger.error('Failed to load guide_wallet', walletError, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to load wallet' },
      { status: 500 }
    );
  }

  let walletRow = walletRowData;

  if (!walletRow) {
    const { data: newWallet, error: insertError } = await client
      .from('guide_wallets')
      .insert({ guide_id: user.id, balance: 0 })
      .select('id, balance')
      .single();

    if (insertError) {
      logger.error('Failed to create guide_wallet', insertError, {
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to init wallet' },
        { status: 500 }
      );
    }

    walletRow = newWallet;
  }

  if (!walletRow) {
    return NextResponse.json(
      { error: 'Failed to initialize wallet' },
      { status: 500 }
    );
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
      {
        error: `Minimum penarikan adalah Rp ${minWithdraw.toLocaleString('id-ID')}`,
      },
      { status: 400 }
    );
  }

  if (amount > currentBalance) {
    return NextResponse.json(
      { error: 'Jumlah melebihi saldo yang tersedia' },
      { status: 400 }
    );
  }

  const balanceBefore = currentBalance;
  const balanceAfter = currentBalance; // saldo bisa dikurangi saat approve, bukan saat request

  // If bank account provided, verify it exists and is approved
  if (bankAccountId) {
    const { data: bankAccount } = await client
      .from('guide_bank_accounts')
      .select('id, status')
      .eq('id', bankAccountId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Rekening bank tidak ditemukan' },
        { status: 404 }
      );
    }

    if (bankAccount.status !== 'approved') {
      return NextResponse.json(
        { error: 'Rekening bank belum disetujui' },
        { status: 400 }
      );
    }
  }

  const { error: txError } = await client
    .from('guide_wallet_transactions')
    .insert({
      wallet_id: walletId,
      transaction_type: 'withdraw_request',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: 'wallet_withdraw',
      status: 'pending',
      bank_account_id: bankAccountId || null,
      created_by: user.id,
    });

  if (txError) {
    logger.error('Failed to create withdraw_request', txError, {
      guideId: user.id,
      amount,
    });
    return NextResponse.json(
      { error: 'Failed to create withdraw request' },
      { status: 500 }
    );
  }

  logger.info('Guide withdraw request created', { guideId: user.id, amount });

  // Invalidate wallet cache for this guide
  await invalidateCache(`guide:wallet:${user.id}*`);
  await invalidateCache(`guide:wallet:tx:${user.id}*`);

  return NextResponse.json({ success: true });
});
