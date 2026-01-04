/**
 * API: Watch Status (Lightweight)
 * GET /api/guide/watch/status - Get lightweight status optimized for smart watch
 * 
 * Returns minimal data needed for watch display:
 * - Current trip info (code, status, passenger count)
 * - SOS status
 * - Quick stats
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get current/ongoing trip
    const { data: ongoingTrips, error: tripsError } = await client
      .from('trips')
      .select('id, trip_code, name, destination, status, date, guests')
      .eq('branch_id', branchContext.branchId)
      .in('status', ['ongoing', 'in_progress'])
      .order('date', { ascending: false })
      .limit(1);

    if (tripsError) {
      logger.error('Failed to fetch ongoing trip for watch', tripsError, {
        userId: user.id,
      });
    }

    const currentTrip = ongoingTrips?.[0] || null;

    // Check if guide is assigned to trip
    let tripAssignment = null;
    if (currentTrip) {
      const { data: assignment } = await client
        .from('trip_guides')
        .select('assignment_status, check_in_at')
        .eq('trip_id', currentTrip.id)
        .eq('guide_id', user.id)
        .maybeSingle();

      tripAssignment = assignment;
    }

    // Check active SOS alert
    const { data: activeSOS } = await client
      .from('sos_alerts')
      .select('id, status')
      .eq('guide_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get quick stats (lightweight)
    const { data: statsData } = await client
      .from('trip_guides')
      .select('id, trips!inner(id, status)', { count: 'exact' })
      .eq('guide_id', user.id)
      .eq('branch_id', branchContext.branchId)
      .eq('trips.status', 'completed')
      .limit(1);

    const totalTrips = statsData?.length || 0;

    return NextResponse.json({
      status: currentTrip ? 'on_trip' : 'standby',
      trip: currentTrip
        ? {
            id: currentTrip.id,
            code: currentTrip.trip_code,
            name: currentTrip.name || currentTrip.destination || 'Active Trip',
            status: currentTrip.status,
            passengerCount: currentTrip.guests || 0,
            date: currentTrip.date,
            checkInStatus: tripAssignment?.check_in_at ? 'checked_in' : 'not_checked_in',
          }
        : null,
      sosActive: !!activeSOS,
      sosId: activeSOS?.id || null,
      stats: {
        totalTrips,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch watch status', error, {
      userId: user.id,
    });
    throw error;
  }
});

