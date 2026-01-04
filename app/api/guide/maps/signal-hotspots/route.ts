/**
 * API: Signal Hotspots
 * GET /api/guide/maps/signal-hotspots?lat=...&lng=...&radius=... - Get nearby signal hotspots
 * POST /api/guide/maps/signal-hotspots - Report new hotspot
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const reportHotspotSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  signal_strength: z.enum(['weak', 'medium', 'strong', 'excellent']),
  network_type: z.enum(['4g', '3g', '2g', 'wifi']).optional(),
  operator: z.string().optional(),
  radius_meters: z.number().int().positive().default(500),
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
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '5000', 10);

  if (!lat || !lng || lat === 0 || lng === 0) {
    return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get nearby hotspots using function
  const { data: hotspots, error } = await client.rpc('find_nearby_signal_hotspots', {
    lat,
    lng,
    radius_meters: radius,
  });

  if (error) {
    logger.error('Failed to fetch signal hotspots', error, { lat, lng, radius });
    return NextResponse.json({ error: 'Failed to fetch hotspots' }, { status: 500 });
  }

  return NextResponse.json({
    hotspots: hotspots || [],
    center: { lat, lng },
    radius,
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = reportHotspotSchema.parse(await request.json());

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

  // Insert hotspot
  const { data: hotspot, error } = await withBranchFilter(
    client.from('signal_hotspots'),
    branchContext,
  )
    .insert({
      branch_id: branchContext.branchId,
      name: payload.name,
      description: payload.description || null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius_meters: payload.radius_meters,
      signal_strength: payload.signal_strength,
      network_type: payload.network_type || null,
      operator: payload.operator || null,
      is_active: true,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create hotspot', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to create hotspot' }, { status: 500 });
  }

  logger.info('Signal hotspot reported', {
    hotspotId: hotspot.id,
    guideId: user.id,
    location: { lat: payload.latitude, lng: payload.longitude },
  });

  return NextResponse.json(
    {
      success: true,
      hotspot,
    },
    { status: 201 },
  );
});
