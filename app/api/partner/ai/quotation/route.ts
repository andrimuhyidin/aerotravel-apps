/**
 * API: Partner AI Quotation Copilot
 * POST /api/partner/ai/quotation
 * BRD 10 - AI Quotation Copilot
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { generateDraftQuotation, type QuotationRequest } from '@/lib/ai/quotation-copilot';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const quotationSchema = z.object({
  prompt: z.string().min(10).max(500),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { prompt } = quotationSchema.parse(body);

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
    // Get partner branch_id
    const { data: partner } = await supabase
      .from('users')
      .select('id, branch_id')
      .eq('id', user.id)
      .single();

    // Generate draft quotation
    const quotationRequest: QuotationRequest = {
      prompt,
      partnerId: user.id,
      branchId: partner?.branch_id || null,
    };

    const draftQuotation = await generateDraftQuotation(quotationRequest);

    logger.info('AI Quotation Copilot request processed', {
      userId: user.id,
      promptLength: prompt.length,
      suggestionsCount: draftQuotation.suggestions.length,
    });

    return NextResponse.json({
      quotation: draftQuotation,
      remaining,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('AI Quotation Copilot error', error, {
      userId: user.id,
    });
    throw error;
  }
});

