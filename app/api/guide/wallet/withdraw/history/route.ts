/**
 * API: Guide Wallet Withdraw History
 * GET /api/guide/wallet/withdraw/history - Get withdraw request history with status tracking
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const client = supabase as unknown as any;

  try {
    const { data: wallet } = await client
      .from('guide_wallets')
      .select('id')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!wallet) {
      return NextResponse.json({ withdraws: [] });
    }

    const walletId = wallet.id as string;

    const { data: withdraws, error } = await client
      .from('guide_wallet_transactions')
      .select('id, amount, balance_before, balance_after, status, description, created_at')
      .eq('wallet_id', walletId)
      .in('transaction_type', ['withdraw_request', 'withdraw_approved', 'withdraw_rejected'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch withdraw history', error, { walletId });
      return NextResponse.json({ error: 'Failed to fetch withdraw history' }, { status: 500 });
    }

    // Group by request (link withdraw_request with withdraw_approved/rejected)
    const withdrawHistory = (withdraws || []).map((w: {
      id: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      status: string | null;
      description: string | null;
      created_at: string;
      transaction_type: string;
    }) => ({
      id: w.id,
      amount: Number(w.amount || 0),
      status: w.status || 'pending',
      createdAt: w.created_at,
      type: w.transaction_type,
      description: w.description,
    }));

    return NextResponse.json({ withdraws: withdrawHistory });
  } catch (error) {
    logger.error('Failed to fetch withdraw history', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch withdraw history' }, { status: 500 });
  }
});

