/**
 * API: Waste Logging
 * POST /api/guide/trips/[id]/waste-log - Create waste log entry
 * GET /api/guide/trips/[id]/waste-log - Get waste logs for trip
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { extractEXIFData } from '@/lib/utils/exif-extractor';
import { logger } from '@/lib/utils/logger';

const wasteLogSchema = z.object({
  waste_type: z.enum(['plastic', 'organic', 'glass', 'hazmat']),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'pieces']),
  disposal_method: z.enum(['landfill', 'recycling', 'incineration', 'ocean']),
  notes: z.string().optional(),
  photos: z.array(z.string().url()).optional(), // Photo URLs (uploaded separately)
});

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

  // Verify trip belongs to guide
  const { data: trip } = await client
    .from('trips')
    .select('id, guide_id')
    .eq('id', tripId)
    .single();

  if (!trip || trip.guide_id !== user.id) {
    return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
  }

  // Get waste logs for this trip
  const { data: wasteLogs, error } = await withBranchFilter(
    client.from('waste_logs'),
    branchContext,
  )
    .select(`
      *,
      photos:waste_log_photos(*)
    `)
    .eq('trip_id', tripId)
    .order('logged_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch waste logs', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch waste logs' }, { status: 500 });
  }

  return NextResponse.json({ waste_logs: wasteLogs || [] });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = wasteLogSchema.parse(await request.json());

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

  // Verify trip belongs to guide
  const { data: trip } = await client
    .from('trips')
    .select('id, guide_id')
    .eq('id', tripId)
    .single();

  if (!trip || trip.guide_id !== user.id) {
    return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 404 });
  }

  // Create waste log entry
  const { data: wasteLog, error } = await withBranchFilter(
    client.from('waste_logs'),
    branchContext,
  )
    .insert({
      trip_id: tripId,
      branch_id: branchContext.branchId,
      waste_type: payload.waste_type,
      quantity: payload.quantity,
      unit: payload.unit,
      disposal_method: payload.disposal_method,
      logged_by: user.id,
      logged_at: new Date().toISOString(),
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create waste log', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to create waste log' }, { status: 500 });
  }

  // If photos provided, create photo records
  if (payload.photos && payload.photos.length > 0) {
    const photoInserts = payload.photos.map((photoUrl) => ({
      waste_log_id: wasteLog.id,
      photo_url: photoUrl,
      photo_gps: null, // Will be extracted from photo upload API
      captured_at: new Date().toISOString(),
    }));

    const { error: photosError } = await client
      .from('waste_log_photos')
      .insert(photoInserts);

    if (photosError) {
      logger.warn('Failed to create waste log photos', { error: photosError, wasteLogId: wasteLog.id });
      // Don't fail the whole request if photos fail
    }
  }

  logger.info('Waste log created', { wasteLogId: wasteLog.id, tripId, guideId: user.id });

  return NextResponse.json({ waste_log: wasteLog });
});

