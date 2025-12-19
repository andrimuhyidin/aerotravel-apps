/**
 * API: Equipment Checklist
 * GET /api/guide/equipment/checklist?tripId=... - Get checklist for trip
 * POST /api/guide/equipment/checklist - Save equipment checklist
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const equipmentItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  checked: z.boolean(),
  photo_url: z.string().optional(),
  photo_gps: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  photo_timestamp: z.string().optional(),
  notes: z.string().optional(),
  needs_repair: z.boolean().optional(),
});

const checklistSchema = z.object({
  tripId: z.string().uuid().optional(),
  equipmentItems: z.array(equipmentItemSchema),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  signature: z.object({
    method: z.enum(['draw', 'upload', 'typed']),
    data: z.string(),
  }).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  let query = supabase
    .from('guide_equipment_checklists')
    .select('*')
    .eq('guide_id', user.id);
  
  if (branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  if (tripId) {
    query = query.eq('trip_id', tripId);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1);

  if (error) {
    logger.error('Failed to fetch equipment checklist', error, { guideId: user.id, tripId });
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }

  return NextResponse.json({
    checklist: data?.[0] ?? null,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = checklistSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, equipmentItems, latitude, longitude, signature } = payload;
  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  // Check if checklist already exists
  let query = supabase
    .from('guide_equipment_checklists')
    .select('id')
    .eq('guide_id', user.id);
  
  if (branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  if (tripId) {
    query = query    .eq('trip_id', tripId);
  } else {
    query = query.is('trip_id', null);
  }

  const { data: existing } = await query.limit(1);

  // branchContext.branchId is guaranteed to be non-null here due to check above
  const checklistData = {
    guide_id: user.id,
    branch_id: branchContext.branchId!,
    trip_id: tripId || null,
    equipment_items: equipmentItems as unknown as any,
    is_completed: equipmentItems.every((item) => item.checked),
    completed_at: equipmentItems.every((item) => item.checked) ? new Date().toISOString() : null,
    latitude: latitude || null,
    longitude: longitude || null,
    location_captured_at: (latitude && longitude) ? new Date().toISOString() : null,
    signature_data: signature?.data || null,
    signature_method: signature?.method || null,
    signature_timestamp: signature ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing?.[0]) {
    // Update existing
    const { data, error } = await supabase
      .from('guide_equipment_checklists')
      .update(checklistData)
      .eq('id', (existing[0] as unknown as { id: string }).id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update equipment checklist', error, { guideId: user.id, tripId });
      return NextResponse.json({ error: 'Failed to save checklist' }, { status: 500 });
    }

    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('guide_equipment_checklists')
      .insert({
        ...checklistData,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create equipment checklist', error, { guideId: user.id, tripId });
      return NextResponse.json({ error: 'Failed to save checklist' }, { status: 500 });
    }

    result = data;
  }

  // Create equipment reports for items that need repair
  const itemsNeedingRepair = equipmentItems.filter((item) => item.needs_repair);
  if (itemsNeedingRepair.length > 0 && result) {
    const reports = itemsNeedingRepair.map((item) => ({
      equipment_checklist_id: result.id,
      trip_id: tripId || null,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      equipment_name: item.name,
      equipment_type: item.id,
      issue_type: 'needs_repair',
      description: item.notes || `Perlu perbaikan: ${item.name}`,
      photo_url: item.photo_url || null,
      severity: 'medium',
      status: 'reported',
      created_at: new Date().toISOString(),
    }));

    await supabase.from('guide_equipment_reports').insert(
      reports.map((r) => {
        const { created_at, ...rest } = r;
        return rest;
      }) as any
    );
  }

  logger.info('Equipment checklist saved', {
    checklistId: result.id,
    guideId: user.id,
    tripId,
    itemsCount: equipmentItems.length,
    completed: result.is_completed,
  });

  return NextResponse.json({
    success: true,
    checklist: result,
  });
});

