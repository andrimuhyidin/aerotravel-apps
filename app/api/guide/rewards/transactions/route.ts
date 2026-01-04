/**
 * API: Guide Reward Transactions
 * GET /api/guide/rewards/transactions - Get points transaction history
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

  // Verify user is guide
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'guide') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const transactionType = searchParams.get('type'); // earn, redeem, expire, etc.

  // Build query
  let query = client
    .from('guide_reward_transactions')
    .select('*')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by transaction type if provided
  if (transactionType) {
    query = query.eq('transaction_type', transactionType);
  }

  const { data: transactions, error } = await query;

  if (error) {
    logger.error('Failed to fetch reward transactions', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }

  logger.info('Reward transactions fetched', {
    userId: user.id,
    count: transactions?.length || 0,
  });

  return NextResponse.json({
    transactions: transactions || [],
    pagination: {
      limit,
      offset,
      total: transactions?.length || 0,
    },
  });
});

