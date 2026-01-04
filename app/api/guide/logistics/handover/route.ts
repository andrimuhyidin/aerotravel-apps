/**
 * API: Logistics Handover
 * GET /api/guide/logistics/handover?tripId=... - Get handovers for trip
 * POST /api/guide/logistics/handover - Create handover
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const handoverItemSchema = z.object({
  item_id: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string(),
  condition: z.string().optional(),
  photo_url: z.string().url().optional(),
  expected_quantity: z.number().optional(), // For inbound, compare with outbound
}).refine((data) => {
  // Validate: piece unit must be integer
  if (data.unit === 'piece' && !Number.isInteger(data.quantity)) {
    return false;
  }
  return true;
}, {
  message: 'Quantity untuk piece harus bilangan bulat',
  path: ['quantity'],
});

const handoverSchema = z.object({
  trip_id: z.string().uuid(),
  handover_type: z.enum(['outbound', 'inbound']),
  to_user_id: z.string().uuid().optional(), // Guide (outbound - set by API) or Warehouse (inbound - required)
  items: z.array(handoverItemSchema),
  from_signature: z.object({
    method: z.enum(['draw', 'upload', 'typed']),
    data: z.string(),
  }).optional(),
  to_signature: z.object({
    method: z.enum(['draw', 'upload', 'typed']),
    data: z.string(),
  }).optional(),
  handover_photos: z.array(z.string().url()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
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
  const client = supabase as unknown as any;

  let query = client
    .from('inventory_handovers')
    .select('*')
    .order('created_at', { ascending: false });

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  if (tripId) {
    query = query.eq('trip_id', tripId);
  } else {
    // Get handovers where user is involved
    query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
  }

  const { data: handovers, error } = await query;

  if (error) {
    logger.error('Failed to fetch handovers', error, { guideId: user.id, tripId });
    return NextResponse.json({ error: 'Failed to fetch handovers' }, { status: 500 });
  }

  return NextResponse.json({
    handovers: handovers || [],
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = handoverSchema.parse(await request.json());

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

  // For outbound: from_user_id = warehouse (can be null), to_user_id = guide (current user)
  // For inbound: from_user_id = guide (current user), to_user_id = warehouse (from payload)
  const fromUserId = payload.handover_type === 'outbound' ? null : user.id;
  const toUserId = payload.handover_type === 'outbound' 
    ? user.id // Outbound: guide receives items
    : (payload.to_user_id || null); // Inbound: warehouse receives items (must be provided)
  
  // Validate: inbound handovers must have to_user_id
  if (payload.handover_type === 'inbound' && !toUserId) {
    logger.error('Inbound handover missing to_user_id', { tripId: payload.trip_id, guideId: user.id });
    return NextResponse.json({ error: 'Warehouse user ID required for inbound handover' }, { status: 400 });
  }

  // Validate items: check quantity rules per unit type
  for (const item of payload.items) {
    if (item.quantity < 0) {
      logger.error('Invalid item quantity', { tripId: payload.trip_id, itemName: item.name, quantity: item.quantity });
      return NextResponse.json({ error: `Quantity untuk "${item.name}" tidak boleh negatif` }, { status: 400 });
    }
    if (item.unit === 'piece' && !Number.isInteger(item.quantity)) {
      logger.error('Invalid item quantity for piece unit', { tripId: payload.trip_id, itemName: item.name, quantity: item.quantity });
      return NextResponse.json({ error: `Quantity untuk "${item.name}" (piece) harus bilangan bulat` }, { status: 400 });
    }
  }

  // Insert handover
  const { data: handover, error } = await withBranchFilter(
    client.from('inventory_handovers'),
    branchContext,
  )
    .insert({
      trip_id: payload.trip_id,
      branch_id: branchContext.branchId,
      handover_type: payload.handover_type,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      items: payload.items as unknown as any,
      from_signature_data: payload.from_signature?.data || null,
      from_signature_method: payload.from_signature?.method || null,
      from_signature_timestamp: payload.from_signature ? new Date().toISOString() : null,
      to_signature_data: payload.to_signature?.data || null,
      to_signature_method: payload.to_signature?.method || null,
      to_signature_timestamp: payload.to_signature ? new Date().toISOString() : null,
      handover_photos: payload.handover_photos || [],
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      location_captured_at: (payload.latitude && payload.longitude) ? new Date().toISOString() : null,
      verified_by_both: !!(payload.from_signature && payload.to_signature),
      status: (payload.from_signature && payload.to_signature) ? 'completed' : 'pending',
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create handover', error, { guideId: user.id, tripId: payload.trip_id });
    return NextResponse.json({ error: 'Failed to create handover' }, { status: 500 });
  }

  logger.info('Handover created', {
    handoverId: handover.id,
    tripId: payload.trip_id,
    type: payload.handover_type,
    itemsCount: payload.items.length,
  });

  return NextResponse.json(
    {
      success: true,
      handover,
    },
    { status: 201 },
  );
});
