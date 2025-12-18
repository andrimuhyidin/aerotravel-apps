/**
 * API: Get Attendance Statistics
 * GET /api/guide/attendance/stats?guideId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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
  const guideId = searchParams.get('guideId') || user.id;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    // Get today's stats
    let todayQuery = withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('id, check_in_at, is_late')
      .eq('guide_id', guideId)
      .gte('check_in_at', todayStart)
      .not('check_in_at', 'is', null);

    const { data: todayRecords } = await todayQuery;

    const todayStats = {
      total: todayRecords?.length || 0,
      onTime: (todayRecords || []).filter((r: { is_late: boolean }) => !r.is_late).length,
      late: (todayRecords || []).filter((r: { is_late: boolean }) => r.is_late).length,
    };

    // Get weekly stats (last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString();

    let weekQuery = client.from('trip_guides')
      .select('check_in_at, is_late')
      .eq('guide_id', guideId)
      .gte('check_in_at', weekStartStr)
      .not('check_in_at', 'is', null);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      weekQuery = weekQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: weekRecords } = await weekQuery;

    // Calculate average check-in time (time of day)
    let totalMinutes = 0;
    let count = 0;
    (weekRecords || []).forEach((record: { check_in_at: string }) => {
      const checkInTime = new Date(record.check_in_at);
      const minutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
      totalMinutes += minutes;
      count++;
    });

    const averageCheckInTime = count > 0 ? totalMinutes / count : null;

    // Weekly streak (consecutive days with check-ins)
    const streakQuery = withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('check_in_at')
      .eq('guide_id', guideId)
      .gte('check_in_at', weekStartStr)
      .not('check_in_at', 'is', null)
      .order('check_in_at', { ascending: false });

    const { data: streakRecords } = await streakQuery;

    // Calculate streak
    let streak = 0;
    const uniqueDates = new Set<string>();
    (streakRecords || []).forEach((record: { check_in_at: string }) => {
      const date = new Date(record.check_in_at).toISOString().slice(0, 10);
      uniqueDates.add(date);
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();
    const todayStr = today.toISOString().slice(0, 10);
    
    // Check consecutive days from today backwards
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().slice(0, 10);
      
      if (sortedDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      today: todayStats,
      week: {
        total: weekRecords?.length || 0,
        onTime: (weekRecords || []).filter((r: { is_late: boolean }) => !r.is_late).length,
        late: (weekRecords || []).filter((r: { is_late: boolean }) => r.is_late).length,
      },
      averageCheckInTime: averageCheckInTime
        ? {
            hours: Math.floor(averageCheckInTime / 60),
            minutes: Math.round(averageCheckInTime % 60),
          }
        : null,
      streak,
    });
  } catch (error) {
    logger.error('Failed to fetch attendance stats', error, { guideId });
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
});
