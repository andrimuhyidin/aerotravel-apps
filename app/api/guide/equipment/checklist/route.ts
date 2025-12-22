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
  quantity: z.number().int().min(0).optional(), // Quantity for items like lifejackets
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(), // Condition rating
  photo_url: z.string().optional(),
  photo_gps: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  photo_timestamp: z.string().optional(),
  photo_location_name: z.string().optional(), // Location name from EXIF or GPS
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

  const checklist = data?.[0] ?? null;

  // If checklist exists, enrich equipment items with maintenance info
  if (checklist && checklist.equipment_items) {
    const client = supabase as unknown as any;
    const equipmentItems = checklist.equipment_items as unknown as Array<{ id: string; name: string }>;
    
    // Get maintenance info for each equipment item
    const maintenanceInfoPromises = equipmentItems.map(async (item) => {
      try {
        // Try to find asset by name or ID
        const { data: asset } = await client
          .from('assets')
          .select('id, last_maintenance_date, next_maintenance_date')
          .eq('branch_id', branchContext.branchId)
          .or(`name.ilike.%${item.name}%,code.ilike.%${item.id}%`)
          .limit(1)
          .maybeSingle();

        if (asset) {
          // Get latest maintenance log
          const { data: latestMaintenance } = await client
            .from('asset_maintenance_logs')
            .select('maintenance_date, maintenance_type, description')
            .eq('asset_id', asset.id)
            .order('maintenance_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextMaintenanceDate = asset.next_maintenance_date
            ? new Date(asset.next_maintenance_date)
            : null;
          const today = new Date();
          const daysUntilMaintenance = nextMaintenanceDate
            ? Math.ceil((nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return {
            itemId: item.id,
            lastMaintenanceDate: asset.last_maintenance_date,
            nextMaintenanceDate: asset.next_maintenance_date,
            daysUntilMaintenance,
            needsMaintenance: daysUntilMaintenance !== null && daysUntilMaintenance <= 30,
            latestMaintenance: latestMaintenance
              ? {
                  date: latestMaintenance.maintenance_date,
                  type: latestMaintenance.maintenance_type,
                  description: latestMaintenance.description,
                }
              : null,
          };
        }
      } catch (err) {
        logger.warn('Failed to fetch maintenance info for equipment item', { error: err, itemId: item.id });
      }
      return null;
    });

    const maintenanceInfo = await Promise.all(maintenanceInfoPromises);
    
    // Merge maintenance info into equipment items
    const enrichedItems = equipmentItems.map((item) => {
      const maintenance = maintenanceInfo.find((m) => m && m.itemId === item.id);
      return {
        ...item,
        maintenance: maintenance
          ? {
              lastMaintenanceDate: maintenance.lastMaintenanceDate,
              nextMaintenanceDate: maintenance.nextMaintenanceDate,
              daysUntilMaintenance: maintenance.daysUntilMaintenance,
              needsMaintenance: maintenance.needsMaintenance,
              latestMaintenance: maintenance.latestMaintenance,
            }
          : null,
      };
    });

    return NextResponse.json({
      checklist: {
        ...checklist,
        equipment_items: enrichedItems,
      },
    });
  }

  return NextResponse.json({
    checklist,
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

  // Validate lifejacket quantity vs passenger count (if tripId provided)
  if (tripId) {
    const lifejacketItem = equipmentItems.find((item) => item.id === 'life_jacket' && item.checked);
    
    if (lifejacketItem) {
      // Get total passenger count for this trip
      const client = supabase as unknown as any;
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
        return NextResponse.json(
          {
            error: 'Lifejacket tidak mencukupi',
            message: `Lifejacket tidak mencukupi. Diperlukan: ${totalPassengers}, Tersedia: ${lifejacketQty}`,
            required: totalPassengers,
            available: lifejacketQty,
          },
          { status: 400 }
        );
      }
    }
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

