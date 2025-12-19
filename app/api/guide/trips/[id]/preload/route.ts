/**
 * Guide Trip Preload API
 * Returns trip data for offline caching
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  logger.info('Preloading trip data', { tripId });

  // Verify user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get trip details
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment (check both trip_crews and trip_guides)
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .in('status', ['assigned', 'confirmed'])
    .maybeSingle();

  const { data: legacyAssignment } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch manifest data directly from database
  let manifest: unknown[] = [];
  try {
    // Get trip bookings
    const { data: tripBookings } = await withBranchFilter(
      client.from('trip_bookings'),
      branchContext,
    )
      .select('booking_id')
      .eq('trip_id', tripId);

    const bookingIds = (tripBookings ?? []).map((b: { booking_id: string }) => b.booking_id) as string[];

    if (bookingIds.length > 0) {
      // Get passengers
      const { data: passengers } = await withBranchFilter(
        client.from('booking_passengers'),
        branchContext,
      )
        .select('id, booking_id, full_name, phone, passenger_type')
        .in('booking_id', bookingIds);

      // Get manifest checks status
      const { data: manifestChecks } = await withBranchFilter(
        client.from('manifest_checks'),
        branchContext,
      )
        .select('passenger_id, boarded_at, returned_at')
        .eq('trip_id', tripId);

      const statusByPassenger = new Map<string, { boarded_at: string | null; returned_at: string | null }>();
      (manifestChecks ?? []).forEach((row: any) => {
        if (row.passenger_id) {
          statusByPassenger.set(String(row.passenger_id), {
            boarded_at: row.boarded_at ?? null,
            returned_at: row.returned_at ?? null,
          });
        }
      });

      // Map passengers with status
      manifest = (passengers || []).map((p: any) => {
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
        };
      });
    }
  } catch (error) {
    logger.warn('Failed to fetch manifest for preload', { tripId, error });
  }

  // Fetch attendance data
  let attendance: unknown = null;
  try {
    const { data: attendanceData } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('check_in_at, check_in_lat, check_in_lng, check_out_at, check_out_lat, check_out_lng, is_late')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (attendanceData) {
      attendance = {
        checkInAt: attendanceData.check_in_at,
        checkInLocation: attendanceData.check_in_lat && attendanceData.check_in_lng
          ? { lat: attendanceData.check_in_lat, lng: attendanceData.check_in_lng }
          : null,
        checkOutAt: attendanceData.check_out_at,
        checkOutLocation: attendanceData.check_out_lat && attendanceData.check_out_lng
          ? { lat: attendanceData.check_out_lat, lng: attendanceData.check_out_lng }
          : null,
        isLate: attendanceData.is_late || false,
      };
    }
  } catch (error) {
    logger.warn('Failed to fetch attendance for preload', { tripId, error });
  }

  // Fetch expenses data
  let expenses: unknown[] = [];
  try {
    const { data: expensesData } = await withBranchFilter(
      client.from('trip_expenses'),
      branchContext,
    )
      .select('id, category, description, total_amount, receipt_url, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    expenses = (expensesData || []).map((exp: any) => ({
      id: exp.id,
      category: exp.category,
      description: exp.description,
      amount: Number(exp.total_amount || 0),
      receiptUrl: exp.receipt_url,
      createdAt: exp.created_at,
    }));
  } catch (error) {
    logger.warn('Failed to fetch expenses for preload', { tripId, error });
  }

  // Evidence data - check if there's a documentation_url or evidence table
  const evidence: unknown[] = [];
  try {
    // Check trip documentation_url
    const tripData = trip as {
      documentation_url?: string | null;
      updated_at?: string | null;
      created_at?: string | null;
    };
    if (tripData.documentation_url) {
      evidence.push({
        type: 'documentation',
        url: tripData.documentation_url,
        uploadedAt: tripData.updated_at || tripData.created_at,
      });
    }

    // If there's an evidence table in the future, fetch from there
    // For now, we only have documentation_url in trips table
  } catch (error) {
    logger.warn('Failed to fetch evidence for preload', { tripId, error });
  }

  logger.info('Trip preload successful', { tripId, manifestCount: manifest.length, expensesCount: expenses.length });

  return NextResponse.json({
    trip,
    manifest,
    attendance,
    evidence,
    expenses,
    preloadedAt: new Date().toISOString(),
  });
});
