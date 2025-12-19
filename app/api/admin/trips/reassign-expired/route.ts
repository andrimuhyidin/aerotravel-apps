/**
 * Auto-Reassign Expired Trip Assignments
 * POST /api/admin/trips/reassign-expired
 * 
 * Background job untuk auto-reassign trip yang deadline-nya sudah lewat
 * Dipanggil oleh cron job setiap 15 menit
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { autoAssignTrip } from '@/lib/integrations/guide-assignment';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check if called by cron (with secret) or admin
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  const isCron = authHeader === `Bearer ${cronSecret}`;
  const isAdmin = await hasRole(['super_admin', 'ops_admin']);

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  // Find expired assignments
  const { data: expiredAssignments, error: fetchError } = await client
    .from('trip_guides')
    .select(`
      id,
      trip_id,
      guide_id,
      reassigned_from_guide_id,
      trip:trips(
        id,
        trip_code,
        trip_date,
        package_id,
        package:packages(
          destination,
          package_type,
          duration_days
        )
      )
    `)
    .eq('assignment_status', 'pending_confirmation')
    .lt('confirmation_deadline', new Date().toISOString())
    .order('confirmation_deadline', { ascending: true })
    .limit(50);

  if (fetchError) {
    logger.error('Failed to fetch expired assignments', fetchError);
    return NextResponse.json({ error: 'Failed to fetch expired assignments' }, { status: 500 });
  }

  if (!expiredAssignments || expiredAssignments.length === 0) {
    return NextResponse.json({
      success: true,
      reassigned: 0,
      message: 'No expired assignments found',
    });
  }

  const results = {
    reassigned: 0,
    failed: 0,
    skipped: 0,
    tripIds: [] as string[],
  };

  for (const expired of expiredAssignments) {
    const trip = expired.trip as {
      id: string;
      trip_code: string;
      trip_date: string;
      package_id: string;
      package: {
        destination: string | null;
        package_type: string | null;
        duration_days: number | null;
      } | null;
    };

    // Check how many times this trip has been reassigned
    const { data: reassignCount } = await client
      .from('trip_guides')
      .select('id', { count: 'exact' })
      .eq('trip_id', trip.id)
      .eq('assignment_status', 'auto_reassigned');

    const reassignmentCount = reassignCount?.length || 0;
    const maxReassignments = 3;

    if (reassignmentCount >= maxReassignments) {
      // Mark as expired and skip
      await client
        .from('trip_guides')
        .update({
          assignment_status: 'expired',
          auto_reassigned_at: new Date().toISOString(),
        })
        .eq('id', expired.id);

      logger.warn('Trip exceeded max reassignments', {
        tripId: trip.id,
        tripCode: trip.trip_code,
        reassignmentCount,
      });

      results.skipped++;
      continue;
    }

    // Mark current assignment as auto_reassigned
    await client
      .from('trip_guides')
      .update({
        assignment_status: 'auto_reassigned',
        auto_reassigned_at: new Date().toISOString(),
      })
      .eq('id', expired.id);

    // Get all guides except the ones who already rejected/expired for this trip
    const { data: rejectedGuides } = await client
      .from('trip_guides')
      .select('guide_id')
      .eq('trip_id', trip.id)
      .in('assignment_status', ['rejected', 'auto_reassigned', 'expired']);

    const excludedGuideIds = rejectedGuides?.map((g: { guide_id: string }) => g.guide_id) || [];

    // Get available guides (excluding already rejected ones)
    const { data: guides } = await client
      .from('users')
      .select('id, full_name, phone')
      .eq('role', 'guide')
      .is('deleted_at', null)
      .not('id', 'in', `(${excludedGuideIds.length > 0 ? excludedGuideIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

    if (!guides || guides.length === 0) {
      logger.warn('No available guides for reassignment', { tripId: trip.id });
      results.failed++;
      continue;
    }

    // Get guide preferences and status (simplified - you may want to enhance this)
    const { data: guideStatuses } = await client
      .from('guide_status')
      .select('guide_id, current_status')
      .in('guide_id', guides.map((g: { id: string }) => g.id));

    const statusMap = new Map(
      (guideStatuses || []).map((s: { guide_id: string; current_status: string }) => [
        s.guide_id,
        s.current_status,
      ]),
    );

    // Build candidates (simplified - you may want to use full preference matching)
    const candidates = guides
      .filter((g: { id: string }) => {
        const status = statusMap.get(g.id);
        return status === 'standby' || !status;
      })
      .map((guide: { id: string; full_name: string; phone: string | null }) => ({
        guide_id: guide.id,
        guide_name: guide.full_name || 'Guide',
        guide_phone: guide.phone,
        current_status: (statusMap.get(guide.id) as 'standby' | 'on_trip' | 'not_available') || 'standby',
        rating: null,
        workload_count: 0,
        preference_score: 50, // Default score
        total_score: 0,
      }));

    if (candidates.length === 0) {
      logger.warn('No available candidates for reassignment', { tripId: trip.id });
      results.failed++;
      continue;
    }

    // Run auto-assignment
    const tripInfo = {
      trip_id: trip.id,
      trip_code: trip.trip_code,
      trip_date: trip.trip_date,
      package_id: trip.package_id,
      package_destination: trip.package?.destination || null,
      package_type: trip.package?.package_type as
        | 'open_trip'
        | 'private_trip'
        | 'corporate'
        | 'kol_trip'
        | null,
      duration_days: trip.package?.duration_days || null,
    };

    const newAssignment = await autoAssignTrip(tripInfo, candidates);

    if (!newAssignment) {
      logger.warn('Auto-reassignment failed - no suitable guide', { tripId: trip.id });
      results.failed++;
      continue;
    }

    // Calculate new deadline
    const tripDate = new Date(trip.trip_date);
    const hMinusOne = new Date(tripDate);
    hMinusOne.setDate(hMinusOne.getDate() - 1);
    hMinusOne.setHours(22, 0, 0, 0);

    const now = new Date();
    const minimumDeadline = new Date(now);
    minimumDeadline.setHours(22, 0, 0, 0);
    if (minimumDeadline < now) {
      minimumDeadline.setDate(minimumDeadline.getDate() + 1);
    }

    const confirmationDeadline = hMinusOne < minimumDeadline ? minimumDeadline : hMinusOne;

    // Create new assignment
    const { error: assignError } = await client.from('trip_guides').insert({
      trip_id: trip.id,
      guide_id: newAssignment.guide_id,
      guide_role: 'lead',
      fee_amount: 300000,
      assignment_status: 'pending_confirmation',
      confirmation_deadline: confirmationDeadline.toISOString(),
      assignment_method: 'reassigned',
      reassigned_from_guide_id: expired.guide_id,
      assigned_at: new Date().toISOString(),
    });

    if (assignError) {
      logger.error('Failed to create reassignment', assignError, {
        tripId: trip.id,
        guideId: newAssignment.guide_id,
      });
      results.failed++;
      continue;
    }

    // Send notification to new guide
    const newGuide = candidates.find((c: { guide_id: string; guide_phone?: string | null }) => c.guide_id === newAssignment.guide_id);
    if (newGuide?.guide_phone) {
      // Import and use notification function
      const { notifyGuideAssignment } = await import('@/lib/integrations/guide-assignment');
      await notifyGuideAssignment(newGuide.guide_phone, trip.trip_code, trip.trip_date);
    }

    results.reassigned++;
    results.tripIds.push(trip.id);

    logger.info('Trip auto-reassigned', {
      tripId: trip.id,
      tripCode: trip.trip_code,
      fromGuideId: expired.guide_id,
      toGuideId: newAssignment.guide_id,
      reassignmentCount: reassignmentCount + 1,
    });
  }

  return NextResponse.json({
    success: true,
    ...results,
    message: `Processed ${expiredAssignments.length} expired assignments`,
  });
});
