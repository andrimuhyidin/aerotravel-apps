/**
 * API: Start Trip
 * POST /api/guide/trips/[id]/start
 * Lead Guide only - Start trip (change status to on_trip)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import {
    getDefaultTemplate,
    mergeFacilities,
} from '@/lib/guide/facilities';
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

  // Check if trip can start (ordered by priority: attendance, facility, equipment, risk, cert)
  // Skip check for ops/admin (they can override)
  if (!isOpsAdmin) {
    const reasons: string[] = [];

    // 1. Check attendance (check-in)
    const { data: tripGuide } = await client
      .from('trip_guides')
      .select('check_in_at')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!tripGuide?.check_in_at) {
      reasons.push('Belum melakukan absensi check-in');
    }

    // 2. Check facility checklist
    const { data: packageTripData } = await client
      .from('trips')
      .select(`
        package:packages(
          inclusions,
          exclusions,
          destination
        )
      `)
      .eq('id', tripId)
      .single();

    const packageData = packageTripData?.package as {
      inclusions?: string[] | null;
      exclusions?: string[] | null;
      destination?: string | null;
    } | null;

    // Detect trip type for template
    let detectedTripType: string | null = null;
    const destination = packageData?.destination || '';
    const searchText = destination.toLowerCase();
    
    if (searchText.includes('boat') || searchText.includes('kapal') || 
        searchText.includes('island') || searchText.includes('pulau') ||
        searchText.includes('snorkel') || searchText.includes('diving') ||
        searchText.includes('karimun') || searchText.includes('derawan') ||
        searchText.includes('raja ampat') || searchText.includes('komodo') ||
        searchText.includes('pahawang') || searchText.includes('kiluan')) {
      detectedTripType = 'boat_trip';
    } else if (searchText.includes('land') || searchText.includes('darat') || 
               searchText.includes('gunung') || searchText.includes('mountain') ||
               searchText.includes('hiking') || searchText.includes('tracking')) {
      detectedTripType = 'land_trip';
    }

    const defaultTemplate = getDefaultTemplate(detectedTripType || undefined);
    const packageInclusions = packageData?.inclusions || [];
    const packageExclusions = packageData?.exclusions || [];

    const mergedFacilities = mergeFacilities(
      defaultTemplate,
      packageInclusions,
      packageExclusions
    );

    const includedFacilities = mergedFacilities.filter((f) => f.status === 'included');
    const totalFacilities = includedFacilities.length;

    if (totalFacilities > 0) {
      const { data: checklistData } = await client
        .from('trip_facility_checklist')
        .select('facility_code, checked')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id);

      const checklistMap = new Map(
        (checklistData || []).map((item: { facility_code: string; checked: boolean }) => [
          item.facility_code,
          item.checked,
        ])
      );

      const checkedFacilities = includedFacilities.filter((f) =>
        checklistMap.get(f.code) === true
      ).length;

      if (checkedFacilities !== totalFacilities) {
        reasons.push(`Fasilitas belum lengkap (${checkedFacilities}/${totalFacilities} sudah di-verify)`);
      }
    }

    // 3. Check equipment checklist (conditional - only if exists)
    const { data: equipmentChecklist } = await client
      .from('guide_equipment_checklists')
      .select('equipment_items, is_completed')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (equipmentChecklist?.equipment_items) {
      const items = equipmentChecklist.equipment_items as Array<{ checked: boolean }>;
      const total = items.length;
      const checked = items.filter((item) => item.checked).length;
      const isComplete = equipmentChecklist.is_completed || checked === total;

      if (!isComplete) {
        reasons.push(`Equipment checklist belum lengkap (${checked}/${total} sudah di-check)`);
      }
    }

    // 4. Check risk assessment (only check if exists)
    const { data: assessment } = await client
      .from('pre_trip_assessments')
      .select('id, is_safe, risk_level')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment?.id) {
      reasons.push('Risk assessment belum dilakukan');
    }

    // 5. Check certifications
    const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
      guide_uuid: user.id,
    });
    if (!certValid) {
      reasons.push('Certifications tidak valid atau expired');
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
