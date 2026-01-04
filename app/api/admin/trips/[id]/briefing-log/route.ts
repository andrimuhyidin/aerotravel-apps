/**
 * API: Briefing Completion Log for Admin
 * GET /api/admin/trips/[id]/briefing-log
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify admin access
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get trip briefing info
    const { data: trip, error: tripError } = await client
      .from('trips')
      .select(`
        id,
        briefing_generated_at,
        briefing_generated_by,
        briefing_updated_at,
        briefing_updated_by,
        briefing_points,
        trip_guides!inner(
          guide_id,
          users!inner(full_name)
        )
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get passenger consents
    const { data: consents, error: consentsError } = await client
      .from('passenger_consents')
      .select('id, consent_status')
      .eq('trip_id', tripId);

    if (consentsError) {
      logger.warn('Failed to fetch passenger consents', { error: consentsError, tripId });
    }

    const consentedCount = (consents || []).filter((c: any) => c.consent_status === 'consented').length;
    const declinedCount = (consents || []).filter((c: any) => c.consent_status === 'declined').length;
    const totalPassengers = (consents || []).length;

    // Get guide name
    const guideName = (trip.trip_guides as any[])?.[0]?.users?.full_name || 'Unknown Guide';

    return NextResponse.json({
      tripId,
      briefingGeneratedAt: trip.briefing_generated_at,
      briefingGeneratedBy: trip.briefing_generated_by,
      briefingUpdatedAt: trip.briefing_updated_at,
      briefingUpdatedBy: trip.briefing_updated_by,
      guideName,
      hasBriefing: !!trip.briefing_points,
      passengerConsents: {
        total: totalPassengers,
        consented: consentedCount,
        declined: declinedCount,
        pending: totalPassengers - consentedCount - declinedCount,
      },
      summary: trip.briefing_generated_at
        ? `Completed ${new Date(trip.briefing_generated_at).toLocaleString('id-ID')} by ${guideName}. ${consentedCount} passengers consented. ${declinedCount} declined.`
        : 'Briefing not yet generated',
    });
  } catch (error) {
    logger.error('Failed to fetch briefing log', error, { tripId });
    return NextResponse.json({ error: 'Failed to fetch briefing log' }, { status: 500 });
  }
});

