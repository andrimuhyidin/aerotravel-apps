/**
 * API: Get Customer Loyalty Points Balance
 * GET /api/user/loyalty/balance
 *
 * Returns the current AeroPoints balance for the authenticated user
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getPointsBalance, getPointsValue } from '@/lib/customers/aeropoints';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const balance = await getPointsBalance(user.id);

    if (!balance) {
      // Return zero balance if no record exists
      return NextResponse.json({
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        valueInRupiah: 0,
      });
    }

    return NextResponse.json({
      balance: balance.balance,
      lifetimeEarned: balance.lifetimeEarned,
      lifetimeSpent: balance.lifetimeSpent,
      valueInRupiah: getPointsValue(balance.balance),
    });
  } catch (error) {
    logger.error('Failed to get points balance', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get points balance' },
      { status: 500 }
    );
  }
});

