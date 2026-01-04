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
      const items = equipmentChecklist.equipment_items as Array<{ id: string; checked: boolean; quantity?: number }>;
      const total = items.length;
      const checked = items.filter((item) => item.checked).length;
      const isComplete = equipmentChecklist.is_completed || checked === total;

      if (!isComplete) {
        reasons.push(`Equipment checklist belum lengkap (${checked}/${total} sudah di-check)`);
      }

      // Validate lifejacket quantity vs passenger count
      const lifejacketItem = items.find((item) => item.id === 'life_jacket' && item.checked);
      if (lifejacketItem) {
        // Get total passenger count
        const { data: tripBookings } = await client
          .from('trip_bookings')
          .select('booking_id')
          .eq('trip_id', tripId);

        const bookingIds = (tripBookings || []).map((tb: { booking_id: string }) => tb.booking_id);
        
        let totalPassengers = 0;
        if (bookingIds.length > 0) {
          const { count } = await client
            .from('booking_passengers')
            .select('id', { count: 'exact', head: true })
            .in('booking_id', bookingIds);
          
          totalPassengers = count || 0;
        }

        const lifejacketQty = lifejacketItem.quantity || 0;
        
        if (lifejacketQty < totalPassengers) {
          reasons.push(`Lifejacket tidak mencukupi. Diperlukan: ${totalPassengers}, Tersedia: ${lifejacketQty}`);
        }
      }
    }

    // 4. Check risk assessment (only check if exists)
    const { data: assessment } = await client
      .from('pre_trip_assessments')
      .select('id, is_safe, risk_level, risk_score, approved_by, approved_at')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment?.id) {
      reasons.push('Risk assessment belum dilakukan');
    } else {
      // Check if risk score > 70 (block threshold)
      const riskScore = assessment.risk_score as number | null;
      if (riskScore !== null && riskScore > 70) {
        // Check if admin has approved override
        if (!assessment.approved_by || !assessment.approved_at) {
          reasons.push(`Risk score terlalu tinggi (${riskScore} > 70). Trip tidak dapat dimulai. Hubungi Admin Ops untuk override.`);
        }
      } else if (!assessment.is_safe) {
        reasons.push('Risk assessment menunjukkan kondisi tidak aman');
      }
    }

    // 5. Check certifications (hard block - no override except admin)
    const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
      guide_uuid: user.id,
    });
    if (!certValid) {
      // Get detailed certification status for better error message
      const requiredTypes = ['sim_kapal', 'first_aid', 'alin'];
      const { data: certs } = await client
        .from('guide_certifications_tracker')
        .select('certification_type, status, expiry_date, certification_name')
        .eq('guide_id', user.id)
        .in('certification_type', requiredTypes)
        .eq('is_active', true)
        .order('certification_type', { ascending: true });

      const certMap = new Map<string, { status: string; expiry_date: string }>(
        (certs || []).map((c: { certification_type: string; status: string; expiry_date: string }) => [
          c.certification_type,
          { status: c.status, expiry_date: c.expiry_date },
        ])
      );

      const missingCerts: string[] = [];
      const expiredCerts: string[] = [];
      const pendingCerts: string[] = [];

      const certLabels: Record<string, string> = {
        sim_kapal: 'SIM Kapal',
        first_aid: 'First Aid',
        alin: 'ALIN',
      };

      for (const type of requiredTypes) {
        const cert = certMap.get(type);
        if (!cert) {
          missingCerts.push(certLabels[type] || type);
        } else if (cert.status === 'expired' || new Date(cert.expiry_date) < new Date()) {
          expiredCerts.push(certLabels[type] || type);
        } else if (cert.status === 'pending') {
          pendingCerts.push(certLabels[type] || type);
        } else if (cert.status !== 'verified') {
          missingCerts.push(certLabels[type] || type);
        }
      }

      let certMessage = 'Certifications tidak valid: ';
      if (missingCerts.length > 0) {
        certMessage += `Missing: ${missingCerts.join(', ')}. `;
      }
      if (expiredCerts.length > 0) {
        certMessage += `Expired: ${expiredCerts.join(', ')}. `;
      }
      if (pendingCerts.length > 0) {
        certMessage += `Pending verification: ${pendingCerts.join(', ')}. `;
      }
      certMessage = certMessage.trim();

      reasons.push(certMessage || 'Certifications tidak valid atau expired');
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

  // Emit trip.status_changed event (non-blocking)
  try {
    const { emitEvent } = await import('@/lib/events/event-bus');
    
    // Get trip info for event
    const { data: tripInfo } = await client
      .from('trips')
      .select('trip_code, package_id, start_date, status')
      .eq('id', tripId)
      .single();

    await emitEvent(
      {
        type: 'trip.status_changed',
        app: 'guide',
        userId: user.id,
        data: {
          tripId: tripId,
          tripCode: tripInfo?.trip_code || tripId,
          oldStatus: trip?.status || 'confirmed',
          newStatus: 'on_trip',
          packageId: tripInfo?.package_id,
          startDate: tripInfo?.start_date,
        },
      },
      {
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }
    ).catch((eventError) => {
      logger.warn('Failed to emit trip.status_changed event', eventError);
    });
  } catch (eventError) {
    logger.warn('Event emission error (non-critical)', {
      error: eventError instanceof Error ? eventError.message : String(eventError),
    });
  }

  // Note: Tracking will be auto-started client-side when trip status changes to 'on_trip'
  // The client-side hook will detect the status change and call startTracking()
  logger.info('Trip status updated to on_trip, tracking should auto-start client-side', { tripId, guideId: user.id });

  return NextResponse.json({
    success: true,
    message: 'Trip berhasil dimulai',
    shouldStartTracking: true, // Flag for client to auto-start tracking
  });
});
