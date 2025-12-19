/**
 * API: Trip Facility Checklist
 * GET /api/guide/trips/[id]/facility-checklist - Get facility checklist status
 * PUT /api/guide/trips/[id]/facility-checklist - Update facility checklist status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateChecklistSchema = z.object({
  facility_code: z.string().min(1),
  checked: z.boolean(),
});

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch checklist from trip_facility_checklist table (if exists)
  // For now, use JSONB field in trips table or separate table
  try {
    const { data: checklistData } = await client
      .from('trip_facility_checklist')
      .select('facility_code, checked')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id);

    if (checklistData && checklistData.length > 0) {
      const checklist: Record<string, boolean> = {};
      checklistData.forEach((item: { facility_code: string; checked: boolean }) => {
        checklist[item.facility_code] = item.checked;
      });

      return NextResponse.json({ checklist });
    }
  } catch (error) {
    // Table might not exist, try trips.facility_checklist JSONB field
    logger.info('trip_facility_checklist table not available, trying JSONB field', {
      tripId,
      guideId: user.id,
    });
  }

  // Fallback: try JSONB field in trips table
  try {
    const { data: trip } = await client
      .from('trips')
      .select('facility_checklist')
      .eq('id', tripId)
      .maybeSingle();

    if (trip?.facility_checklist) {
      return NextResponse.json({ checklist: trip.facility_checklist as Record<string, boolean> });
    }
  } catch (error) {
    logger.warn('Failed to fetch facility checklist from trips table', {
      tripId,
      error,
    });
  }

  // Return empty checklist if nothing found
  return NextResponse.json({ checklist: {} });
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;
  const supabase = await createClient();
  const payload = updateChecklistSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Verify guide assignment
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!crewAssignment && !legacyAssignment) {
    return NextResponse.json({ error: 'Forbidden - Not assigned to this trip' }, { status: 403 });
  }

  // Try to use trip_facility_checklist table
  try {
    // Check if record exists
    const { data: existing } = await client
      .from('trip_facility_checklist')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .eq('facility_code', payload.facility_code)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await client
        .from('trip_facility_checklist')
        .update({
          checked: payload.checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await client
        .from('trip_facility_checklist')
        .insert({
          trip_id: tripId,
          guide_id: user.id,
          branch_id: branchContext.branchId,
          facility_code: payload.facility_code,
          checked: payload.checked,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    logger.info('Facility checklist updated', {
      tripId,
      guideId: user.id,
      facilityCode: payload.facility_code,
      checked: payload.checked,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Table might not exist, use JSONB field in trips table as fallback
    logger.info('trip_facility_checklist table not available, using JSONB fallback', {
      tripId,
      guideId: user.id,
    });

    try {
      // Get current checklist from trips table
      const { data: trip } = await client
        .from('trips')
        .select('facility_checklist')
        .eq('id', tripId)
        .maybeSingle();

      const currentChecklist = (trip?.facility_checklist as Record<string, boolean>) || {};
      currentChecklist[payload.facility_code] = payload.checked;

      // Update JSONB field
      const { error: updateError } = await client
        .from('trips')
        .update({
          facility_checklist: currentChecklist,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (updateError) throw updateError;

      logger.info('Facility checklist updated (JSONB)', {
        tripId,
        guideId: user.id,
        facilityCode: payload.facility_code,
        checked: payload.checked,
      });

      return NextResponse.json({ success: true });
    } catch (jsonbError) {
      logger.error('Failed to update facility checklist', jsonbError, {
        tripId,
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update checklist. Database might need migration.' },
        { status: 500 }
      );
    }
  }
});
