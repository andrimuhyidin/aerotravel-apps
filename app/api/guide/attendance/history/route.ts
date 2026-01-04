/**
 * API: Get Attendance History
 * GET /api/guide/attendance/history?guideId=xxx&limit=10
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
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    const { data: attendanceRecords, error } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select(`
        id,
        check_in_at,
        check_out_at,
        is_late,
        trip:trips(
          id,
          trip_code,
          trip_date,
          package:packages(name)
        )
      `)
      .eq('guide_id', guideId)
      .not('check_in_at', 'is', null)
      .order('check_in_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch attendance history', error, { guideId });
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    const history = (attendanceRecords || []).map((record: any) => {
      const trip = record.trip;
      const checkInTime = record.check_in_at;
      const checkOutTime = record.check_out_at;

      let duration: number | null = null;
      if (checkInTime && checkOutTime) {
        duration = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
      }

      return {
        id: record.id,
        tripId: trip?.id,
        tripCode: trip?.trip_code,
        tripName: trip?.package?.name || trip?.trip_code || 'Trip',
        tripDate: trip?.trip_date,
        checkInTime,
        checkOutTime,
        duration: duration ? Math.round(duration / 1000 / 60) : null, // duration in minutes
        isLate: Boolean(record.is_late),
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error('Failed to fetch attendance history', error, { guideId });
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
});
