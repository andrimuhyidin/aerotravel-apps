/**
 * API: Get Trip Manifest
 * GET /api/guide/manifest?tripId=...
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type PassengerRow = {
  id: string;
  booking_id: string;
  full_name: string | null;
  phone: string | null;
  passenger_type: string;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Pastikan guide ini memang ter-assign ke trip tersebut
  let assignmentQuery = client
    .from('trip_guides')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    assignmentQuery = assignmentQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: assignment, error: assignmentError } =
    await assignmentQuery.maybeSingle();

  if (assignmentError) {
    logger.error('Failed to verify guide assignment', assignmentError, {
      tripId,
      guideId: user.id,
      errorCode: assignmentError.code,
      errorMessage: assignmentError.message,
    });
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get trip info and documentation URL
  let tripQuery = client
    .from('trips')
    .select('id, trip_code, trip_date, documentation_url')
    .eq('id', tripId);

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery.single();

  if (tripError || !trip) {
    logger.error('Trip not found for manifest', tripError, {
      tripId,
      guideId: user.id,
      errorCode: tripError?.code,
      errorMessage: tripError?.message,
    });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Ambil semua booking_id untuk trip ini
  // Note: trip_bookings doesn't have branch_id, filtering already done at trips level
  const { data: tripBookings, error: bookingsError } = await client
    .from('trip_bookings')
    .select('booking_id')
    .eq('trip_id', tripId);

  if (bookingsError) {
    logger.error('Failed to load trip bookings for manifest', bookingsError, {
      tripId,
      guideId: user.id,
      errorCode: bookingsError.code,
      errorMessage: bookingsError.message,
    });
    return NextResponse.json(
      { error: 'Failed to load manifest data' },
      { status: 500 }
    );
  }

  const bookingIds = (tripBookings ?? []).map(
    (b: { booking_id: string }) => b.booking_id
  ) as string[];

  let passengers: PassengerRow[] = [];

  if (bookingIds.length > 0) {
    // Note: booking_passengers doesn't have branch_id, filtering via booking_id relationship
    const { data: passengerRows, error: paxError } = await client
      .from('booking_passengers')
      .select('id, booking_id, full_name, phone, passenger_type')
      .in('booking_id', bookingIds);

    if (paxError) {
      logger.error('Failed to load booking passengers for manifest', paxError, {
        tripId,
        guideId: user.id,
        bookingIdsCount: bookingIds.length,
        errorCode: paxError.code,
        errorMessage: paxError.message,
      });
      return NextResponse.json(
        { error: 'Failed to load passengers' },
        { status: 500 }
      );
    }

    passengers = (passengerRows as PassengerRow[]) ?? [];
  }

  // Ambil status boarding/return dari manifest_checks
  // Note: manifest_checks filtering via trip_id (already filtered at trips level)
  const { data: manifestRows, error: manifestError } = await client
    .from('manifest_checks')
    .select('passenger_id, boarded_at, returned_at')
    .eq('trip_id', tripId);

  if (manifestError) {
    logger.warn('Failed to load manifest checks', {
      tripId,
      guideId: user.id,
      error: manifestError,
    });
    // Continue without manifest checks - passengers will show as 'pending'
  }

  const statusByPassenger = new Map<
    string,
    { boarded_at: string | null; returned_at: string | null }
  >();

  (manifestRows ?? []).forEach((row: any) => {
    if (row.passenger_id) {
      statusByPassenger.set(String(row.passenger_id), {
        boarded_at: (row.boarded_at as string | null) ?? null,
        returned_at: (row.returned_at as string | null) ?? null,
      });
    }
  });

  const manifestPassengers = passengers.map((p) => {
    const status = statusByPassenger.get(p.id);
    let passengerStatus: 'pending' | 'boarded' | 'returned' = 'pending';

    if (status?.returned_at) {
      passengerStatus = 'returned';
    } else if (status?.boarded_at) {
      passengerStatus = 'boarded';
    }

    return {
      id: p.id,
      name: p.full_name ?? '',
      phone: p.phone ?? undefined,
      type: p.passenger_type as 'adult' | 'child' | 'infant',
      status: passengerStatus,
      notes: undefined,
    };
  });

  const totalPax = manifestPassengers.length;
  const boardedCount = manifestPassengers.filter(
    (p) => p.status === 'boarded' || p.status === 'returned'
  ).length;
  const returnedCount = manifestPassengers.filter(
    (p) => p.status === 'returned'
  ).length;

  const manifest = {
    tripId: trip.id as string,
    tripName: (trip.trip_code as string) ?? 'Trip',
    date: (trip.trip_date as string) ?? '',
    passengers: manifestPassengers,
    totalPax,
    boardedCount,
    returnedCount,
    documentationUrl: (trip.documentation_url as string | null) ?? undefined,
  };

  // Log manifest access
  try {
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await client.from('manifest_access_logs').insert({
      trip_id: tripId,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      access_type: 'view',
      accessed_at: new Date().toISOString(),
      ip_address: clientIp !== 'unknown' ? clientIp : null,
      user_agent: userAgent,
      device_info: null, // Can be enhanced with device detection
      created_at: new Date().toISOString(),
    });
  } catch (auditError) {
    // Don't fail the request if audit logging fails
    logger.warn('Failed to log manifest access', {
      error: auditError,
      tripId,
      guideId: user.id,
    });
  }

  logger.info('Guide manifest fetched', { tripId, guideId: user.id, totalPax });

  return NextResponse.json(manifest);
});
