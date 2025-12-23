import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/guide/attendance/trip-summary
 * Get trip summary after check-out (duration, distance, PAX count, etc.)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('tripId');
  const guideId = searchParams.get('guideId') || user.id;

  if (!tripId) {
    return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get attendance record
  const attendanceQuery = supabase
    .from('guide_attendance')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId)
    .single();

  const { data: attendance, error: attendanceError } = await attendanceQuery;

  if (attendanceError || !attendance) {
    logger.error('Attendance not found', attendanceError, { tripId, guideId });
    return NextResponse.json(
      { error: 'Attendance not found' },
      { status: 404 }
    );
  }

  // Calculate duration
  const checkInTime = attendance.check_in_time
    ? new Date(attendance.check_in_time)
    : null;
  const checkOutTime = attendance.check_out_time
    ? new Date(attendance.check_out_time)
    : null;

  let durationMinutes = null;
  let durationHours = null;
  if (checkInTime && checkOutTime) {
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    durationMinutes = Math.floor(durationMs / (1000 * 60));
    durationHours = (durationMinutes / 60).toFixed(1);
  }

  // Get GPS pings to calculate distance
  let pingsQuery = supabase
    .from('gps_pings')
    .select('latitude, longitude, recorded_at')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId)
    .order('recorded_at', { ascending: true });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    pingsQuery = pingsQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: pings } = await pingsQuery;

  // Calculate total distance using Haversine formula
  let totalDistanceKm = 0;
  if (pings && pings.length > 1) {
    for (let i = 0; i < pings.length - 1; i++) {
      const p1 = pings[i];
      const p2 = pings[i + 1];
      if (
        p1 &&
        p2 &&
        p1.latitude &&
        p1.longitude &&
        p2.latitude &&
        p2.longitude
      ) {
        const R = 6371; // Earth radius in km
        const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
        const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((p1.latitude * Math.PI) / 180) *
            Math.cos((p2.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        totalDistanceKm += distance;
      }
    }
  }

  // Get trip details for PAX count
  let tripQuery = supabase
    .from('trips')
    .select('id, trip_code, total_pax, status')
    .eq('id', tripId)
    .single();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip } = await tripQuery;

  // Get incidents if any
  let incidentsQuery = supabase
    .from('incident_reports')
    .select('id, incident_type, severity, status')
    .eq('trip_id', tripId);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    incidentsQuery = incidentsQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: incidents } = await incidentsQuery;

  const summary = {
    tripId,
    tripCode: trip?.trip_code,
    duration: {
      minutes: durationMinutes,
      hours: durationHours,
      formatted: durationMinutes
        ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
        : null,
    },
    distance: {
      km: Math.round(totalDistanceKm * 10) / 10,
      formatted: `${Math.round(totalDistanceKm * 10) / 10} km`,
    },
    pax: {
      total: trip?.total_pax || 0,
      // TODO: Add actual passenger count confirmation from manifest
    },
    status: trip?.status || 'completed',
    incidents: {
      count: incidents?.length || 0,
      hasIncidents: (incidents?.length || 0) > 0,
      details: incidents || [],
    },
    attendance: {
      checkInTime: attendance.check_in_time,
      checkOutTime: attendance.check_out_time,
      isLate: attendance.is_late || false,
      penaltyAmount: attendance.penalty_amount || 0,
    },
  };

  logger.info('Trip summary generated', {
    tripId,
    guideId,
    duration: durationMinutes,
    distance: totalDistanceKm,
  });

  return NextResponse.json(summary);
});
