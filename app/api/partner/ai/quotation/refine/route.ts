/**
 * API: AI Quotation Refinement
 * POST /api/partner/ai/quotation/refine
 * BRD 10 - AI Quotation Refinement
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { refineQuotation, type RefinementRequest } from '@/lib/ai/quotation-refinement';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const refineSchema = z.object({
  originalQuotation: z.any(), // DraftQuotation type
  refinementPrompt: z.string().min(5).max(500),
  conversationHistory: z.array(z.object({
    type: z.enum(['refinement', 'response']),
    content: z.string(),
  })).optional(),
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
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['refinementPrompt'] });
  const { originalQuotation, refinementPrompt, conversationHistory } = refineSchema.parse(sanitizedBody);

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
    // Refine quotation
    const refinementRequest: RefinementRequest = {
      originalQuotation,
      refinementPrompt,
      conversationHistory,
    };

    const refinedQuotation = await refineQuotation(refinementRequest);

    logger.info('Quotation refinement request processed', {
      userId: user.id,
      refinementPromptLength: refinementPrompt.length,
      changesCount: refinedQuotation.refinementHistory?.length || 0,
    });

    return NextResponse.json({
      quotation: refinedQuotation,
      remaining,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Quotation refinement error', error, {
      userId: user.id,
    });
    throw error;
  }
});

