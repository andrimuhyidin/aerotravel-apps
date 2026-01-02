/**
 * API: Partner AI Chat Assistant
 * POST /api/partner/ai/chat
 * BRD 10 - AI Travel Assistant (chatbot)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { chatPartnerAssistant, getPartnerContext } from '@/lib/ai/partner-assistant';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  includeContext: z.boolean().optional().default(true),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['message'] });
  const { message, includeContext } = chatSchema.parse(sanitizedBody);

  // Rate limiting
  const { success, limit, remaining } = await aiChatRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak request. Silakan tunggu sebentar.',
        limit,
        remaining,
      },
      { status: 429 }
    );
  }

  try {
    // Get partner context if requested
    let context;
    if (includeContext) {
      context = await getPartnerContext(user.id);
    }

    // Get AI response
    const response = await chatPartnerAssistant(message, context);

    logger.info('Partner AI chat request processed', {
      userId: user.id,
      messageLength: message.length,
      hasContext: !!context,
    });

    return NextResponse.json({
      response,
      remaining,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Partner AI chat error', error, {
      userId: user.id,
    });
    throw error;
  }
});

