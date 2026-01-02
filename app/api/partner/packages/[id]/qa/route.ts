/**
 * API: Product Q&A
 * POST /api/partner/packages/[id]/qa
 * BRD 10 - AI Q&A on Products
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { answerProductQuestion, type ProductQuestion } from '@/lib/ai/product-qa';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const qaSchema = z.object({
  question: z.string().min(5).max(500),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: packageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const { question } = qaSchema.parse(body);

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
      .eq('id', partnerId)
      .single();

    // Answer question
    const productQuestion: ProductQuestion = {
      question,
      packageId,
      context: {
        partnerId,
        branchId: partner?.branch_id || null,
      },
    };

    const answer = await answerProductQuestion(productQuestion);

    logger.info('Product Q&A request processed', {
      userId: user.id,
      partnerId,
      packageId,
      questionLength: question.length,
      confidence: answer.confidence,
    });

    return NextResponse.json({
      answer,
      remaining,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Product Q&A error', error, {
      userId: user.id,
      partnerId,
      packageId,
    });
    throw error;
  }
});

