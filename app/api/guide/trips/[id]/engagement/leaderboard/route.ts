/**
 * API: Guest Engagement Leaderboard
 * GET /api/guide/trips/[id]/engagement/leaderboard - Get leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get leaderboard
  const { data: leaderboard, error } = await client
    .from('guest_engagement_leaderboard')
    .select(`
      *,
      passenger:booking_passengers(id, name, age)
    `)
    .eq('trip_id', tripId)
    .order('rank', { ascending: true })
    .limit(20);

  if (error) {
    logger.error('Failed to fetch leaderboard', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }

  return NextResponse.json({
    leaderboard: leaderboard || [],
  });
});
