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
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');

  if (!partnerId) {
    return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('mitra_wallets')
    .select('balance, credit_limit')
    .eq('mitra_id', partnerId)
    .single();

  if (error) {
    logger.error('Failed to fetch wallet balance', error);
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  return NextResponse.json({
    balance: Number(data.balance),
    creditLimit: Number(data.credit_limit),
    availableBalance: Number(data.balance) + Number(data.credit_limit),
  });
});
