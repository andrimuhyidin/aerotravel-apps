/**
 * API: Watch Quick Actions
 * GET /api/guide/watch/quick-actions - Get available quick actions for watch
 * 
 * Returns list of actions that can be performed from watch:
 * - SOS (always available)
 * - Check-in (if trip active)
 * - Start/End trip (if applicable)
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
    // Get current trip
    const { data: ongoingTrips } = await client
      .from('trips')
      .select('id, trip_code, status')
      .eq('branch_id', branchContext.branchId)
      .in('status', ['ongoing', 'in_progress'])
      .order('date', { ascending: false })
      .limit(1);

    const currentTrip = ongoingTrips?.[0] || null;

    // Check assignment and check-in status
    let assignmentStatus = null;
    let isCheckedIn = false;

    if (currentTrip) {
      const { data: assignment } = await client
        .from('trip_guides')
        .select('assignment_status, check_in_at')
        .eq('trip_id', currentTrip.id)
        .eq('guide_id', user.id)
        .maybeSingle();

      assignmentStatus = assignment?.assignment_status;
      isCheckedIn = !!assignment?.check_in_at;
    }

    // Build actions list
    const actions = [
      {
        id: 'sos',
        label: 'SOS Emergency',
        icon: 'alert-triangle',
        enabled: true,
        color: 'red',
        priority: 1,
      },
    ];

    // Add check-in action if trip active
    if (currentTrip && !isCheckedIn) {
      actions.push({
        id: 'check_in',
        label: 'Check In',
        icon: 'check-circle',
        enabled: true,
        color: 'blue',
        priority: 2,
      });
    }

    // Add view trip details if trip active
    if (currentTrip) {
      actions.push({
        id: 'view_trip',
        label: 'Trip Details',
        icon: 'map-pin',
        enabled: true,
        color: 'gray',
        priority: 3,
      });
    }

    // Add emergency contact call
    actions.push({
      id: 'call_ops',
      label: 'Call Ops',
      icon: 'phone',
      enabled: true,
      color: 'blue',
      priority: 4,
    });

    // Sort by priority
    actions.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      actions,
      currentTrip: currentTrip
        ? {
            id: currentTrip.id,
            code: currentTrip.trip_code,
            status: currentTrip.status,
          }
        : null,
    });
  } catch (error) {
    logger.error('Failed to fetch watch quick actions', error, {
      userId: user.id,
    });
    throw error;
  }
});

