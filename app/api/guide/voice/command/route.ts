/**
 * API: AI Voice Assistant
 * POST /api/guide/voice/command
 * 
 * Voice commands, hands-free operation, voice-to-text
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { commandToAction, processVoiceCommand } from '@/lib/ai/voice-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const voiceCommandSchema = z.object({
  text: z.string().min(1), // Transcribed voice text
  tripId: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = voiceCommandSchema.parse(await request.json());

  try {
    // Get active trip if not provided
    let activeTripId = payload.tripId;
    if (!activeTripId) {
      const client = supabase as unknown as any;
      const { data: activeTrip } = await client
        .from('trip_guides')
        .select('trip_id')
        .eq('guide_id', user.id)
        .eq('assignment_status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      activeTripId = activeTrip?.trip_id;
    }

    // Process voice command
    const command = await processVoiceCommand(payload.text, {
      activeTripId,
      currentLocation: payload.location,
    });

    // Convert to action
    const action = commandToAction(command);

    // Add tripId to parameters if needed
    if (activeTripId && !action.payload) {
      action.payload = { tripId: activeTripId };
    } else if (activeTripId && action.payload) {
      action.payload.tripId = activeTripId;
    }

    logger.info('Voice command processed', {
      guideId: user.id,
      intent: command.intent,
      action: action.endpoint,
    });

    return NextResponse.json({
      command,
      action,
    });
  } catch (error) {
    logger.error('Failed to process voice command', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal memproses perintah suara' },
      { status: 500 }
    );
  }
});
