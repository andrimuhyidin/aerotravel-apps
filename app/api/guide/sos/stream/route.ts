/**
 * API: SOS GPS Streaming
 * POST /api/guide/sos/stream - Stream GPS location for active SOS alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const streamLocationSchema = z.object({
  sos_alert_id: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy_meters: z.number().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = streamLocationSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify SOS alert belongs to this guide
  const { data: sosAlert, error: sosError } = await client
    .from('sos_alerts')
    .select('id, guide_id, status, streaming_active')
    .eq('id', payload.sos_alert_id)
    .eq('guide_id', user.id)
    .single();

  if (sosError || !sosAlert) {
    logger.error('SOS alert not found or unauthorized', sosError, {
      sosAlertId: payload.sos_alert_id,
      guideId: user.id,
    });
    return NextResponse.json({ error: 'SOS alert not found' }, { status: 404 });
  }

  if (sosAlert.status !== 'active') {
    return NextResponse.json(
      { error: 'SOS alert is not active' },
      { status: 400 }
    );
  }

  // Insert location history
  const { data: locationRecord, error: locationError } = await client
    .from('sos_location_history')
    .insert({
      sos_alert_id: payload.sos_alert_id,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_meters: payload.accuracy_meters || null,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (locationError) {
    logger.error('Failed to record location', locationError, {
      sosAlertId: payload.sos_alert_id,
    });
    return NextResponse.json(
      { error: 'Failed to record location' },
      { status: 500 }
    );
  }

  // Update SOS alert with latest location
  await client
    .from('sos_alerts')
    .update({
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_meters: payload.accuracy_meters || null,
      last_location_update: new Date().toISOString(),
      streaming_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.sos_alert_id);

  return NextResponse.json({
    success: true,
    location: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy_meters: payload.accuracy_meters,
      recorded_at: locationRecord.recorded_at,
    },
  });
});

/**
 * GET /api/guide/sos/stream?alert_id=xxx - Get location history for SOS alert
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const alertId = searchParams.get('alert_id');

  if (!alertId) {
    return NextResponse.json(
      { error: 'alert_id is required' },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Verify SOS alert belongs to this guide
  const { data: sosAlert } = await client
    .from('sos_alerts')
    .select('id, guide_id')
    .eq('id', alertId)
    .eq('guide_id', user.id)
    .single();

  if (!sosAlert) {
    return NextResponse.json({ error: 'SOS alert not found' }, { status: 404 });
  }

  // Get location history
  const { data: history, error } = await client
    .from('sos_location_history')
    .select('*')
    .eq('sos_alert_id', alertId)
    .order('recorded_at', { ascending: false })
    .limit(100); // Last 100 locations

  if (error) {
    logger.error('Failed to fetch location history', error, { alertId });
    return NextResponse.json(
      { error: 'Failed to fetch location history' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    history: history || [],
  });
});
