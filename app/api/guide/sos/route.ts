/**
 * API: SOS Alert
 * POST /api/guide/sos
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { sendTextMessage } from '@/lib/integrations/whatsapp';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const sosSchema = z.object({
  tripId: z.string().optional(),
  alertType: z.string().default('emergency'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracy: z.number().optional(),
  message: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = sosSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, alertType, latitude, longitude, accuracy, message } = payload;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Use 'no-trip' if tripId is not provided or empty
  const finalTripId = tripId && tripId !== 'no-trip' ? tripId : null;

  const { data: alert, error: sosError } = await withBranchFilter(
    client.from('sos_alerts'),
    branchContext,
  )
    .insert({
      trip_id: finalTripId,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      alert_type: alertType,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      accuracy_meters: accuracy ?? null,
      message,
      status: 'active',
    })
    .select('id')
    .single();

  if (sosError) {
    logger.error('SOS alert creation failed', sosError, { tripId, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to create SOS alert' },
      { status: 500 },
    );
  }

  let tripData: { trip_code?: string; package?: { name?: string } } | null = null;
  
  if (finalTripId) {
    const { data } = await withBranchFilter(
      client.from('trips'),
      branchContext,
    )
      .select(
        `
        trip_code,
        package:packages(name)
      `,
      )
      .eq('id', finalTripId)
      .maybeSingle();
    
    tripData = data;
  }

  const { data: guideData } = await client
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .single();

  try {
    const opsPhone = process.env.WHATSAPP_OPS_PHONE;
    if (opsPhone) {
      const alertTextLines = [
        '🚨 *SOS ALERT* 🚨',
        '',
        `Trip : ${tripData?.trip_code ?? '-'} (${tripData?.package?.name ?? '-'})`,
        `Guide: ${guideData?.full_name ?? user.id} (${guideData?.phone ?? '-'})`,
        `Type : ${alertType}`,
        `Loc  : ${latitude ?? '-'}, ${longitude ?? '-'}`,
        message ? `Note : ${message}` : null,
        '',
        'Mohon segera tindak lanjuti dari dashboard Ops.',
      ].filter(Boolean) as string[];

      const text = alertTextLines.join('\n');
      await sendTextMessage(opsPhone, text);
    }
  } catch (waError) {
    logger.error('Failed to send WhatsApp SOS notification', waError, {
      tripId,
      guideId: user.id,
    });
  }

  logger.warn('SOS ALERT CREATED', {
    alertId: alert.id,
    tripId: finalTripId,
    tripCode: tripData?.trip_code,
    guideId: user.id,
    guideName: guideData?.full_name,
    alertType,
    location: { latitude, longitude },
  });

  return NextResponse.json({
    success: true,
    alertId: alert.id,
  });
});
