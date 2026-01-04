import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/guide/attendance/next-trip
 * Get next scheduled trip after current trip
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
  const currentTripId = searchParams.get('currentTripId');
  const guideId = searchParams.get('guideId') || user.id;

  if (!currentTripId) {
    return NextResponse.json(
      { error: 'Missing currentTripId' },
      { status: 400 }
    );
  }

  const branchContext = await getBranchContext(user.id);

  // Get current trip date
  let currentTripQuery = supabase
    .from('trips')
    .select('trip_date, departure_time')
    .eq('id', currentTripId)
    .single();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    currentTripQuery = currentTripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: currentTrip } = await currentTripQuery;

  if (!currentTrip) {
    return NextResponse.json(null);
  }

  // Get next trip assignments for this guide
  const { data: assignments } = await supabase
    .from('trip_guides')
    .select(
      `
      trip_id,
      trip:trips(
        id,
        trip_code,
        trip_date,
        departure_time,
        status,
        total_pax,
        package:packages(
          id,
          name,
          destination,
          meeting_point
        )
      )
    `
    )
    .eq('guide_id', guideId)
    .order('trip_id', { ascending: true });

  // Filter for trips after current trip
  const currentDateTime = `${currentTrip.trip_date}T${currentTrip.departure_time || '00:00:00'}`;

  type TripAssignment = {
    trip_id: string;
    trip: {
      id: string;
      trip_code: string | null;
      trip_date: string;
      departure_time: string | null;
      status: string | null;
      total_pax: number | null;
      package?: {
        id: string;
        name: string | null;
        destination: string | null;
        meeting_point: string | null;
      } | null;
    } | null;
  };

  const nextTrips = ((assignments ?? []) as TripAssignment[])
    .map((a) => a.trip)
    .filter((t): t is NonNullable<typeof t> => {
      if (!t || !t.trip_date) return false;
      const tripDateTime = `${t.trip_date}T${t.departure_time || '00:00:00'}`;
      return (
        tripDateTime > currentDateTime &&
        (t.status === 'scheduled' || t.status === 'confirmed')
      );
    })
    .sort((a, b) => {
      const aDateTime = `${a.trip_date}T${a.departure_time || '00:00:00'}`;
      const bDateTime = `${b.trip_date}T${b.departure_time || '00:00:00'}`;
      return aDateTime.localeCompare(bDateTime);
    });

  if (nextTrips.length === 0) {
    return NextResponse.json(null);
  }

  const nextTrip = nextTrips[0];

  // Calculate time until departure
  const now = new Date();
  const departureDateTime = new Date(
    `${nextTrip.trip_date}T${nextTrip.departure_time || '07:30:00'}`
  );
  const diffMs = departureDateTime.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const formatted =
    diffHours > 24
      ? `${Math.floor(diffHours / 24)} hari ${diffHours % 24} jam`
      : diffHours > 0
        ? `${diffHours} jam ${diffMinutes} menit`
        : `${diffMinutes} menit`;

  const result = {
    ...nextTrip,
    timeUntilDeparture: {
      hours: diffHours,
      minutes: diffMinutes,
      formatted,
    },
  };

  logger.info('Next trip fetched', {
    currentTripId,
    nextTripId: nextTrip.id,
    timeUntilDeparture: formatted,
  });

  return NextResponse.json(result);
});
