/**
 * API: Auto-Assign Trip to Guide
 * POST /api/admin/trips/[id]/auto-assign
 *
 * Automatically assigns trip to best matching guide based on:
 * - Guide availability (status = standby)
 * - Preference match (destination, trip type, duration)
 * - Rating
 * - Workload balance
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
    autoAssignTrip,
    calculatePreferenceScore,
    notifyGuideAssignment,
} from '@/lib/integrations/guide-assignment';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tripId } = await context.params;
  const client = supabase as unknown as any;

  // Get trip info
  const { data: trip, error: tripError } = await client
    .from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      package_id,
      package:packages(
        destination,
        package_type,
        duration_days
      )
    `
    )
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    logger.error('Trip not found for auto-assignment', tripError, { tripId });
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if already assigned
  const { data: existingAssignments } = await client
    .from('trip_guides')
    .select('guide_id')
    .eq('trip_id', tripId);

  if (existingAssignments && existingAssignments.length > 0) {
    return NextResponse.json(
      { error: 'Trip already has assigned guides' },
      { status: 400 }
    );
  }

  const packageInfo = trip.package as {
    destination: string | null;
    package_type: string | null;
    duration_days: number | null;
  } | null;

  const tripInfo = {
    trip_id: tripId,
    trip_code: (trip.trip_code as string) ?? '',
    trip_date: (trip.trip_date as string) ?? '',
    package_id: (trip.package_id as string) ?? '',
    package_destination: packageInfo?.destination ?? null,
    package_type: packageInfo?.package_type as
      | 'open_trip'
      | 'private_trip'
      | 'corporate'
      | 'kol_trip'
      | null,
    duration_days: packageInfo?.duration_days ?? null,
  };

  // Get all guides with role 'guide'
  const { data: guides } = await client
    .from('users')
    .select('id, full_name, phone')
    .eq('role', 'guide')
    .is('deleted_at', null);

  if (!guides || guides.length === 0) {
    return NextResponse.json({ error: 'No guides available' }, { status: 404 });
  }

  const guideIds = guides.map((g: any) => g.id) as string[];

  // Get guide statuses
  const { data: guideStatuses } = await client
    .from('guide_status')
    .select('guide_id, current_status')
    .in('guide_id', guideIds);

  const statusMap = new Map<string, string>();
  (guideStatuses ?? []).forEach((s: any) => {
    statusMap.set(s.guide_id, s.current_status);
  });

  // Get guide preferences
  const { data: preferences } = await client
    .from('guide_preferences')
    .select('guide_id, favorite_destinations, preferred_trip_types, preferred_durations')
    .in('guide_id', guideIds);

  const prefMap = new Map<string, any>();
  (preferences ?? []).forEach((p: any) => {
    prefMap.set(p.guide_id, p);
  });

  // Get guide ratings (average from trip ratings - simplified, can be enhanced)
  // For now, use a placeholder - in real implementation, calculate from ratings table
  const ratingMap = new Map<string, number>();

  // Calculate workload (number of trips assigned in next 30 days)
  const workloadStart = new Date(tripInfo.trip_date);
  workloadStart.setDate(workloadStart.getDate() - 15);
  const workloadEnd = new Date(tripInfo.trip_date);
  workloadEnd.setDate(workloadEnd.getDate() + 15);

  // First get trips in the date range
  const { data: tripsInRange } = await client
    .from('trips')
    .select('id')
    .gte('trip_date', workloadStart.toISOString().split('T')[0])
    .lte('trip_date', workloadEnd.toISOString().split('T')[0]);

  const tripIdsInRange = (tripsInRange ?? []).map((t: any) => t.id) as string[];

  // Then get trip_guides assignments for those trips and our guides
  const { data: workloadData } =
    tripIdsInRange.length > 0
      ? await client
          .from('trip_guides')
          .select('guide_id')
          .in('guide_id', guideIds)
          .in('trip_id', tripIdsInRange)
      : { data: [] };

  const workloadMap = new Map<string, number>();
  (workloadData ?? []).forEach((w: any) => {
    workloadMap.set(w.guide_id, (workloadMap.get(w.guide_id) ?? 0) + 1);
  });

  // Build candidates
  const candidates = guides.map((guide: any) => {
    const guideId = guide.id as string;
    const prefs = prefMap.get(guideId) ?? null;

    const preferenceScore = calculatePreferenceScore(
      {
        favorite_destinations: prefs?.favorite_destinations ?? null,
        preferred_trip_types: prefs?.preferred_trip_types ?? null,
        preferred_durations: prefs?.preferred_durations ?? null,
      },
      tripInfo
    );

    return {
      guide_id: guideId,
      guide_name: (guide.full_name as string) ?? 'Guide',
      guide_phone: guide.phone as string | null,
      current_status: (statusMap.get(guideId) as 'standby' | 'on_trip' | 'not_available') ?? null,
      rating: ratingMap.get(guideId) ?? null,
      workload_count: workloadMap.get(guideId) ?? 0,
      preference_score: preferenceScore,
      total_score: 0, // Will be calculated in autoAssignTrip
    };
  });

  // Run auto-assignment algorithm
  const assignment = await autoAssignTrip(tripInfo, candidates);

  if (!assignment) {
    return NextResponse.json(
      { error: 'No suitable guide found for auto-assignment' },
      { status: 404 }
    );
  }

  // Calculate confirmation deadline (H-1 jam 22:00 WIB)
  const tripDate = new Date(tripInfo.trip_date);
  const hMinusOne = new Date(tripDate);
  hMinusOne.setDate(hMinusOne.getDate() - 1);
  hMinusOne.setHours(22, 0, 0, 0);
  
  // Minimum deadline: hari ini jam 22:00 (jika trip_date < 2 hari dari sekarang)
  const now = new Date();
  const minimumDeadline = new Date(now);
  minimumDeadline.setHours(22, 0, 0, 0);
  if (minimumDeadline < now) {
    minimumDeadline.setDate(minimumDeadline.getDate() + 1);
  }
  
  const confirmationDeadline = hMinusOne < minimumDeadline ? minimumDeadline : hMinusOne;

  // Create assignment with pending_confirmation status
  const { data: assignmentData, error: assignError } = await client
    .from('trip_guides')
    .insert({
      trip_id: tripId,
      guide_id: assignment.guide_id,
      guide_role: 'lead',
      fee_amount: 300000, // Default fee, can be made configurable
      assignment_status: 'pending_confirmation',
      confirmation_deadline: confirmationDeadline.toISOString(),
      assignment_method: 'auto',
      assigned_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (assignError) {
    logger.error('Failed to create trip_guides assignment', assignError, {
      tripId,
      guideId: assignment.guide_id,
    });
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }

  // Send notification to guide with deadline
  const guidePhone = candidates.find((c: typeof candidates[0]) => c.guide_id === assignment.guide_id)?.guide_phone;
  if (guidePhone) {
    await notifyGuideAssignment(
      guidePhone,
      tripInfo.trip_code,
      tripInfo.trip_date,
      confirmationDeadline.toISOString()
    );
  }

  logger.info('Trip auto-assigned successfully', {
    tripId,
    tripCode: tripInfo.trip_code,
    guideId: assignment.guide_id,
    guideName: assignment.guide_name,
    score: assignment.score,
  });

  return NextResponse.json({
    success: true,
    assignment: {
      guide_id: assignment.guide_id,
      guide_name: assignment.guide_name,
      score: assignment.score,
      reason: assignment.reason,
    },
  });
});
