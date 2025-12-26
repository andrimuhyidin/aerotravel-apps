/**
 * API: Partner Wallet Balance
 * GET /api/partner/wallet/balance
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    const { data, error } = await client
      .from('mitra_wallets')
      .select('balance, credit_limit, credit_used')
      .eq('mitra_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch wallet balance', error, {
        userId: user.id,
      });
      throw error;
    }

    // If wallet doesn't exist, return zero balance
    if (!data) {
      return NextResponse.json({
        balance: 0,
        creditLimit: 0,
        creditUsed: 0,
        availableBalance: 0,
      });
    }

    const balance = Number(data.balance || 0);
    const creditLimit = Number(data.credit_limit || 0);
    const creditUsed = Number(data.credit_used || 0);
    const availableBalance = balance + (creditLimit - creditUsed);

    return NextResponse.json({
      balance,
      creditLimit,
      creditUsed,
      availableBalance,
    });
  } catch (error) {
    logger.error('Failed to get wallet balance', error, {
      userId: user.id,
    });
    throw error;
  }
});
