/**
 * API: Guide Reward Expiring Points
 * GET /api/guide/rewards/expiring - Get expiring points (30 days warning)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { getExpiringPoints } from '@/lib/guide/reward-points';
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
  const days = parseInt(searchParams.get('days') || '30', 10);

  // Get expiring points
  const expiringPoints = await getExpiringPoints(user.id, days);

  // Calculate total
  const total = expiringPoints.reduce((sum, item) => sum + item.points, 0);

  logger.info('Expiring points fetched', {
    userId: user.id,
    days,
    total,
  });

  return NextResponse.json({
    expiringPoints,
    total,
    warningDays: days,
  });
});

