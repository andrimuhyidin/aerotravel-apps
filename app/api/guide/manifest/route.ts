/**
 * API: Get Trip Manifest
 * GET /api/guide/manifest?tripId=...
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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
  const { data: assignment, error: assignmentError } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (assignmentError) {
    logger.error('Failed to verify guide assignment', { error: assignmentError.message });
    return NextResponse.json({ error: 'Failed to verify access' }, { status: 500 });
  }

  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get trip info and documentation URL
  const { data: trip, error: tripError } = await withBranchFilter(
    client.from('trips'),
    branchContext,
  )
    .select('id, trip_code, trip_date, documentation_url')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    logger.error('Trip not found for manifest', { tripId, error: tripError?.message });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Ambil semua booking_id untuk trip ini
  const { data: tripBookings, error: bookingsError } = await withBranchFilter(
    client.from('trip_bookings'),
    branchContext,
  )
    .select('booking_id')
    .eq('trip_id', tripId);

  if (bookingsError) {
    logger.error('Failed to load trip bookings for manifest', {
      tripId,
      error: bookingsError.message,
    });
    return NextResponse.json({ error: 'Failed to load manifest data' }, { status: 500 });
  }

  const bookingIds = (tripBookings ?? []).map((b: { booking_id: string }) => b.booking_id) as string[];

  let passengers: PassengerRow[] = [];

  if (bookingIds.length > 0) {
    const { data: passengerRows, error: paxError } = await withBranchFilter(
      client.from('booking_passengers'),
      branchContext,
    )
      .select('id, booking_id, full_name, phone, passenger_type')
      .in('booking_id', bookingIds);

    if (paxError) {
      logger.error('Failed to load booking passengers for manifest', {
        tripId,
        error: paxError.message,
      });
      return NextResponse.json({ error: 'Failed to load passengers' }, { status: 500 });
    }

    passengers = (passengerRows as PassengerRow[]) ?? [];
  }

  // Ambil status boarding/return dari manifest_checks
  const { data: manifestRows, error: manifestError } = await withBranchFilter(
    client.from('manifest_checks'),
    branchContext,
  )
    .select('passenger_id, boarded_at, returned_at')
    .eq('trip_id', tripId);

  if (manifestError) {
    logger.error('Failed to load manifest checks', { tripId, error: manifestError.message });
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
  const returnedCount = manifestPassengers.filter((p) => p.status === 'returned').length;

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

  logger.info('Guide manifest fetched', { tripId, guideId: user.id, totalPax });

  return NextResponse.json(manifest);
});
