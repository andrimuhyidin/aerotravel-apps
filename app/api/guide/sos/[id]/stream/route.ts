/**
 * API: SOS Location Streaming
 * POST /api/guide/sos/[id]/stream - Stream GPS location updates for SOS alert
 * 
 * Features:
 * - Accept location pings from client
 * - Store in sos_location_history
 * - Send WhatsApp location updates every 30 seconds
 * - Auto-stop after 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const streamLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const { id: sosAlertId } = resolvedParams;
  const supabase = await createClient();
  const body = streamLocationSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Verify SOS alert belongs to user
  const { data: sosAlert, error: sosError } = await withBranchFilter(
    client.from('sos_alerts'),
    branchContext,
  )
    .select('id, guide_id, trip_id, status, streaming_active, created_at')
    .eq('id', sosAlertId)
    .eq('guide_id', user.id)
    .single();

  if (sosError || !sosAlert) {
    logger.error('SOS alert not found or access denied', sosError, {
      sosAlertId,
      guideId: user.id,
    });
    return NextResponse.json({ error: 'SOS alert not found' }, { status: 404 });
  }

  // Check if streaming is still active
  if (!sosAlert.streaming_active) {
    return NextResponse.json({ error: 'Streaming not active' }, { status: 400 });
  }

  // Check if SOS is still active (not resolved)
  if (sosAlert.status !== 'active') {
    return NextResponse.json({ error: 'SOS alert is not active' }, { status: 400 });
  }

  // Check if 30 minutes have passed (auto-stop)
  const createdAt = new Date(sosAlert.created_at);
  const now = new Date();
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  if (minutesElapsed > 30) {
    // Auto-stop streaming
    await client.rpc('stop_sos_streaming', { p_sos_alert_id: sosAlertId });
    return NextResponse.json({ 
      error: 'Streaming stopped (30 minute limit)',
      stopped: true,
    }, { status: 400 });
  }

  // Store location in history
  const { error: insertError } = await client
    .from('sos_location_history')
    .insert({
      sos_alert_id: sosAlertId,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy_meters: body.accuracyMeters ?? null,
      recorded_at: now.toISOString(),
    });

  if (insertError) {
    logger.error('Failed to insert location history', insertError, {
      sosAlertId,
      guideId: user.id,
    });
    return NextResponse.json({ error: 'Failed to record location' }, { status: 500 });
  }

  // Update last_location_update in sos_alerts
  await client
    .from('sos_alerts')
    .update({ last_location_update: now.toISOString() })
    .eq('id', sosAlertId);

  // Send WhatsApp update every 30 seconds (check if last update was > 30s ago)
  const whatsappGroupId = process.env.WHATSAPP_SOS_GROUP_ID;
  const opsPhone = process.env.WHATSAPP_OPS_PHONE;
  
  // Get last WhatsApp update time from notification_logs or use created_at
  const { data: lastNotification } = await client
    .from('notification_logs')
    .select('sent_at')
    .eq('entity_type', 'sos_alert')
    .eq('entity_id', sosAlertId)
    .eq('channel', 'whatsapp')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastWhatsAppUpdate = lastNotification?.sent_at 
    ? new Date(lastNotification.sent_at)
    : createdAt;
  
  const secondsSinceLastUpdate = (now.getTime() - lastWhatsAppUpdate.getTime()) / 1000;

  if (secondsSinceLastUpdate >= 30) {
    // Send WhatsApp location update
    const mapsLink = `https://www.google.com/maps?q=${body.latitude},${body.longitude}`;
    const updateMessage = `📍 *Update Lokasi SOS*\n\nLokasi terbaru:\n${mapsLink}\n\nWaktu: ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

    // Send to group
    if (whatsappGroupId) {
      try {
        await sendTextMessage(whatsappGroupId, updateMessage);
        logger.info('SOS location update sent to WhatsApp group', {
          sosAlertId,
          guideId: user.id,
        });
      } catch (error) {
        logger.error('Failed to send SOS location update to group', error, {
          sosAlertId,
          guideId: user.id,
        });
      }
    }

    // Send to ops admin
    if (opsPhone) {
      try {
        await sendTextMessage(opsPhone, updateMessage);
      } catch (error) {
        logger.error('Failed to send SOS location update to ops', error, {
          sosAlertId,
          guideId: user.id,
        });
      }
    }

    // Log notification
    await client.from('notification_logs').insert({
      user_id: user.id,
      channel: 'whatsapp',
      entity_type: 'sos_alert',
      entity_id: sosAlertId,
      subject: 'SOS Location Update',
      body: updateMessage,
      status: 'sent',
      sent_at: now.toISOString(),
    });
  }

  logger.info('SOS location streamed', {
    sosAlertId,
    guideId: user.id,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  return NextResponse.json({
    success: true,
    locationRecorded: true,
    minutesElapsed: Math.round(minutesElapsed),
    remainingMinutes: Math.max(0, 30 - Math.round(minutesElapsed)),
  });
});

