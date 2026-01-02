/**
 * API: AI Incident Report Assistant
 * POST /api/guide/incidents/ai-assist
 * 
 * Auto-generate report dari foto + voice, extract key info
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    extractIncidentInfoFromVoice,
    generateIncidentReport,
} from '@/lib/ai/incident-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const assistSchema = z.object({
  type: z.enum(['report', 'voice']),
  description: z.string().min(1),
  images: z
    .array(
      z.object({
        base64: z.string(),
        mimeType: z.string(),
      })
    )
    .optional(),
  voiceText: z.string().optional(), // Transcribed voice note
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'AI assist');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const payload = assistSchema.parse(await request.json());

  try {
    if (payload.type === 'report') {
      // Generate full incident report
      const report = await generateIncidentReport(payload.description, payload.images);

      return NextResponse.json({ report });
    } else if (payload.type === 'voice') {
      // Extract info from voice transcription
      if (!payload.voiceText) {
        return NextResponse.json({ error: 'Voice text required' }, { status: 400 });
      }

      const info = await extractIncidentInfoFromVoice(payload.voiceText);

      return NextResponse.json({ info });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    logger.error('Failed to assist with incident report', error, {
      guideId: user.id,
      type: payload.type,
    });
    return NextResponse.json(
      { error: 'Gagal memproses laporan insiden' },
      { status: 500 }
    );
  }
});
