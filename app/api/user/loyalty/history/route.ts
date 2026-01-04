/**
 * API: Get Customer Loyalty Points History
 * GET /api/user/loyalty/history
 *
 * Returns the transaction history for the authenticated user's AeroPoints
 * Supports pagination via query params: limit, offset
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getPointsHistory } from '@/lib/customers/aeropoints';
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

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate params
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    const transactions = await getPointsHistory(user.id, safeLimit, safeOffset);

    return NextResponse.json({
      transactions,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        hasMore: transactions.length === safeLimit,
      },
    });
  } catch (error) {
    logger.error('Failed to get points history', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get points history' },
      { status: 500 }
    );
  }
});

