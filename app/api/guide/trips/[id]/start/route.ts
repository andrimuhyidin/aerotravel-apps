/**
 * API: Start Trip
 * POST /api/guide/trips/[id]/start
 * Lead Guide only - Start trip (change status to on_trip)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Check if user is Lead Guide for this trip
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id, role, status')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .eq('role', 'lead')
    .in('status', ['assigned', 'confirmed'])
    .maybeSingle();

  // Fallback: check trip_guides (legacy)
  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id, guide_role')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .maybeSingle();

  // Check if ops/admin (can start any trip)
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isOpsAdmin = userProfile?.role === 'ops_admin' || userProfile?.role === 'super_admin';
  const isLeadGuide = crewAssignment?.role === 'lead' || legacyAssignment?.guide_role === 'lead';

  if (!isLeadGuide && !isOpsAdmin) {
    return NextResponse.json(
      { error: 'Hanya Lead Guide yang dapat start trip' },
      { status: 403 }
    );
  }

  // Get trip
  let tripQuery = client
    .from('trips')
    .select('id, status, branch_id')
    .eq('id', tripId)
    .single();

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery;

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Check if trip can start (certifications + risk assessment)
  // Skip check for ops/admin (they can override)
  if (!isOpsAdmin) {
    const { data: canStart, error: checkError } = await client.rpc('can_trip_start', {
      trip_uuid: tripId,
      guide_uuid: user.id,
    });

    if (checkError) {
      logger.warn('Failed to check trip start eligibility, proceeding with manual check', checkError);
      
      // Fallback: manual check
      const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
        guide_uuid: user.id,
      });

      const { data: assessment } = await client
        .from('pre_trip_assessments')
        .select('is_safe, risk_level')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const reasons: string[] = [];
      if (!certValid) {
        reasons.push('Certifications tidak valid atau expired');
      }
      if (!assessment?.is_safe) {
        reasons.push(`Risk assessment: ${assessment?.risk_level || 'unknown'} risk - perlu admin approval`);
      }

      if (reasons.length > 0) {
        return NextResponse.json(
          {
            error: 'Trip tidak dapat dimulai',
            reasons,
            can_override: true, // Admin can override
          },
          { status: 403 }
        );
      }
    } else if (!canStart) {
      // Get detailed reasons
      const reasons: string[] = [];
      const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
        guide_uuid: user.id,
      });
      if (!certValid) {
        reasons.push('Certifications tidak valid atau expired');
      }

      const { data: assessment } = await client
        .from('pre_trip_assessments')
        .select('is_safe, risk_level')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!assessment?.is_safe) {
        reasons.push(`Risk assessment: ${assessment?.risk_level || 'unknown'} risk - perlu admin approval`);
      }

      return NextResponse.json(
        {
          error: 'Trip tidak dapat dimulai',
          reasons,
          can_override: true, // Admin can override
        },
        { status: 403 }
      );
    }
  }

  // Update trip status
  const { error: updateError } = await client
    .from('trips')
    .update({
      status: 'on_trip',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  if (updateError) {
    logger.error('Failed to start trip', updateError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to start trip' }, { status: 500 });
  }

  logger.info('Trip started', { tripId, guideId: user.id, role: isLeadGuide ? 'lead' : 'admin' });

  return NextResponse.json({
    success: true,
    message: 'Trip berhasil dimulai',
  });
});
