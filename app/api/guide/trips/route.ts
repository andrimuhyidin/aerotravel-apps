/**
 * API: Guide Trips List
 * GET /api/guide/trips
 *
 * Returns list of trips assigned to the current guide.
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get assignments from both trip_crews (new) and trip_guides (legacy)
  // trip_crews (multi-guide system)
  const tripCrewsQuery = client.from('trip_crews')
    .select('trip_id, role, status, assigned_at, confirmed_at')
    .eq('guide_id', user.id)
    .in('status', ['assigned', 'confirmed']);
  
  const { data: tripCrewsData, error: tripCrewsError } = await tripCrewsQuery;
  
  if (tripCrewsError) {
    logger.error('Failed to load trip_crews', tripCrewsError, { guideId: user.id });
  }

  // trip_guides (legacy single-guide system)
  const tripGuidesQuery = client.from('trip_guides')
    .select('trip_id, assignment_status, confirmation_deadline, confirmed_at, rejected_at, fee_amount')
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation']);
  
  const { data: tripGuidesData, error: tripGuidesError } = await tripGuidesQuery;
  
  if (tripGuidesError) {
    logger.error('Failed to load trip_guides', tripGuidesError, { guideId: user.id });
  }
  
  // Create map of trip_id -> assignment info
  type AssignmentInfo = {
    assignment_status: string;
    confirmation_deadline: string | null;
    confirmed_at: string | null;
    rejected_at: string | null;
    fee_amount: number | null;
    role?: 'lead' | 'support' | null; // From trip_crews
  };
  
  const assignmentMap = new Map<string, AssignmentInfo>();

  // Add trip_crews assignments
  (tripCrewsData ?? []).forEach((tc: {
    trip_id: string;
    role: 'lead' | 'support';
    status: string;
    assigned_at: string;
    confirmed_at: string | null;
  }) => {
    assignmentMap.set(tc.trip_id, {
      assignment_status: tc.status === 'confirmed' ? 'confirmed' : 'pending_confirmation',
      confirmation_deadline: null,
      confirmed_at: tc.confirmed_at,
      rejected_at: null,
      fee_amount: null,
      role: tc.role,
    });
  });

  // Add trip_guides assignments (legacy, don't override if already in map)
  (tripGuidesData ?? []).forEach((tg: {
    trip_id: string;
    assignment_status: string;
    confirmation_deadline: string | null;
    confirmed_at: string | null;
    rejected_at: string | null;
    fee_amount: number | null;
  }) => {
    if (!assignmentMap.has(tg.trip_id)) {
      assignmentMap.set(tg.trip_id, {
        assignment_status: tg.assignment_status,
        confirmation_deadline: tg.confirmation_deadline,
        confirmed_at: tg.confirmed_at,
        rejected_at: tg.rejected_at,
        fee_amount: tg.fee_amount,
        role: null, // Legacy assignments don't have role
      });
    }
  });

  const tripIds = Array.from(assignmentMap.keys());
  
  if (tripIds.length === 0) {
    return NextResponse.json({ trips: [] });
  }
  
  // Get trips with branch filter - include more details for dashboard
  let tripsQuery = client.from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      status,
      total_pax,
      package:packages(
        id,
        name,
        destination,
        city,
        duration_days,
        meeting_point
      )
    `,
    )
    .in('id', tripIds);
  
  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripsQuery = tripsQuery.eq('branch_id', branchContext.branchId);
  }
  
  const { data: tripsData, error } = await tripsQuery.order('trip_date', { ascending: true });

  if (error) {
    logger.error('Failed to load guide trips', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }

  const nowDate = new Date().toISOString().slice(0, 10);

  const trips = (tripsData ?? [])
    .map((trip: {
      id: string;
      trip_code: string | null;
      trip_date: string | null;
      status: string | null;
      total_pax: number | null;
      package?: { name: string | null } | null;
    }) => {
      const date = trip.trip_date ?? nowDate;
      const statusRaw = trip.status ?? 'scheduled';

      let uiStatus: 'ongoing' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
      if (statusRaw === 'on_trip' || statusRaw === 'on_the_way' || statusRaw === 'preparing') {
        uiStatus = 'ongoing';
      } else if (statusRaw === 'completed') {
        uiStatus = 'completed';
      } else if (statusRaw === 'cancelled') {
        uiStatus = 'cancelled';
      } else {
        // scheduled: compare date
        uiStatus = date >= nowDate ? 'upcoming' : 'completed';
      }

      const assignment = assignmentMap.get(trip.id) || null;
      const crewRole = assignment?.role ?? null;
      
      const packageData = trip.package as {
        name?: string | null;
        destination?: string | null;
        city?: string | null;
        duration_days?: number | null;
        meeting_point?: string | null;
      } | null;

      return {
        id: trip.id,
        code: trip.trip_code ?? '',
        name: packageData?.name ?? trip.trip_code ?? 'Trip',
        date,
        guests: trip.total_pax ?? 0,
        status: uiStatus,
        assignment_status: assignment?.assignment_status || null,
        confirmation_deadline: assignment?.confirmation_deadline || null,
        confirmed_at: assignment?.confirmed_at || null,
        rejected_at: assignment?.rejected_at || null,
        fee_amount: assignment?.fee_amount ?? null,
        // Additional details for enhanced display
        destination: packageData?.destination ?? packageData?.city ?? null,
        duration: packageData?.duration_days ?? null,
        meeting_point: packageData?.meeting_point ?? null,
        crew_role: crewRole, // Add crew role to response
      };
    });

  return NextResponse.json({ trips });
});
