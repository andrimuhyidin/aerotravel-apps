/**
 * API: Check if Trip Can Start
 * GET /api/guide/trips/[id]/can-start - Check if trip can start with detailed readiness status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import {
    getDefaultTemplate,
    mergeFacilities,
} from '@/lib/guide/facilities';
import { createClient } from '@/lib/supabase/server';

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

  // 1. Check certifications
  const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
    guide_uuid: user.id,
  });

  // 2. Check risk assessment (only check if exists, not the safety status)
  const { data: assessment } = await client
    .from('pre_trip_assessments')
    .select('id, is_safe, risk_level, created_at')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const riskAssessmentExists = Boolean(assessment?.id);

  // 3. Check attendance (check-in)
  const { data: tripGuide } = await client
    .from('trip_guides')
    .select('check_in_at')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();
  
  const attendanceCheckedIn = Boolean(tripGuide?.check_in_at);

  // 4. Check facility checklist
  // Get package facilities directly from database
  const { data: tripData } = await client
    .from('trips')
    .select(`
      package_id,
      package:packages(
        inclusions,
        exclusions,
        package_type,
        destination
      )
    `)
    .eq('id', tripId)
    .single();

  const packageData = tripData?.package as {
    inclusions?: string[] | null;
    exclusions?: string[] | null;
    package_type?: string | null;
    destination?: string | null;
  } | null;

  // Detect trip type for template selection (same logic as package-info route)
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

  // Get default template and merge with package data
  const defaultTemplate = getDefaultTemplate(detectedTripType || undefined);
  const packageInclusions = packageData?.inclusions || [];
  const packageExclusions = packageData?.exclusions || [];

  // Merge facilities to get included facilities list (same as package-info route)
  const mergedFacilities = mergeFacilities(
    defaultTemplate,
    packageInclusions,
    packageExclusions
  );

  // Filter only included facilities (yang perlu di-check)
  const includedFacilities = mergedFacilities.filter((f) => f.status === 'included');
  const totalFacilities = includedFacilities.length;

  // Get facility checklist status
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

  const facilityChecklistComplete = totalFacilities > 0 && checkedFacilities === totalFacilities;

  // 5. Get manifest check-in info (informational only)
  // Get trip bookings to count passengers
  const { data: tripBookings } = await client
    .from('trip_bookings')
    .select('id, booking_id')
    .eq('trip_id', tripId);

  const bookingIds = (tripBookings || []).map((tb: { booking_id: string }) => tb.booking_id);
  
  let totalPassengers = 0;
  let boardedPassengers = 0;

  if (bookingIds.length > 0) {
    const { data: passengers } = await client
      .from('booking_passengers')
      .select('id')
      .in('booking_id', bookingIds);

    totalPassengers = passengers?.length || 0;

    // Count boarded passengers from manifest_checks
    const { data: manifestChecks } = await client
      .from('manifest_checks')
      .select('passenger_id, boarded_at')
      .eq('trip_id', tripId)
      .not('boarded_at', 'is', null);

    boardedPassengers = manifestChecks?.length || 0;
  }

  const manifestPercentage = totalPassengers > 0 
    ? Math.round((boardedPassengers / totalPassengers) * 100)
    : 0;

  // 6. Check equipment checklist (always check, but may not have items)
  let equipmentChecklistComplete = false;
  let equipmentChecklistChecked = 0;
  let equipmentChecklistTotal = 0;

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
    equipmentChecklistTotal = items.length;
    equipmentChecklistChecked = items.filter((item) => item.checked).length;
    equipmentChecklistComplete = equipmentChecklist.is_completed || equipmentChecklistChecked === equipmentChecklistTotal;
  }

  // Build reasons array (ordered by priority: attendance, facility, equipment, risk, cert)
  const reasons: string[] = [];
  if (!attendanceCheckedIn) {
    reasons.push('Belum melakukan absensi check-in');
  }
  if (!facilityChecklistComplete && totalFacilities > 0) {
    reasons.push(`Fasilitas belum lengkap (${checkedFacilities}/${totalFacilities} sudah di-verify)`);
  }
  if (!equipmentChecklistComplete) {
    reasons.push(`Equipment checklist belum lengkap (${equipmentChecklistChecked}/${equipmentChecklistTotal} sudah di-check)`);
  }
  if (!riskAssessmentExists) {
    reasons.push('Risk assessment belum dilakukan');
  }
  if (!certValid) {
    reasons.push('Certifications tidak valid atau expired');
  }

  // Overall can_start: all required items must be complete
  const canStart =
    attendanceCheckedIn &&
    facilityChecklistComplete &&
    equipmentChecklistComplete &&
    riskAssessmentExists &&
    (certValid || false);

  // Admin approval keseluruhan: apakah semua requirement sudah terpenuhi untuk bisa start trip
  // Jika semua requirement sudah OK, berarti sudah dapat approval admin secara keseluruhan
  // Jika ada yang belum OK, berarti perlu hubungi admin dulu
  const adminApprovalComplete = canStart;

  return NextResponse.json({
    can_start: canStart,
    attendance_checked_in: attendanceCheckedIn,
    facility_checklist: {
      complete: facilityChecklistComplete,
      checked: checkedFacilities,
      total: totalFacilities,
    },
    equipment_checklist: {
      complete: equipmentChecklistComplete,
      checked: equipmentChecklistChecked,
      total: equipmentChecklistTotal,
    },
    risk_assessment: {
      exists: riskAssessmentExists,
      safe: assessment?.is_safe || false,
    },
    certifications_valid: certValid || false,
    admin_approval_complete: adminApprovalComplete,
    manifest: {
      boarded: boardedPassengers,
      total: totalPassengers,
      percentage: manifestPercentage,
    },
    reasons: reasons.length > 0 ? reasons : undefined,
  });
});
