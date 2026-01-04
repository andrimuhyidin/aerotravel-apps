/**
 * AI Chatbot API dengan Feature Flag & Rate Limiting
 * Sesuai PRD 2.5.C - Feature Flagging
 * PRD 5.2.A - AeroBot (AI Concierge)
 */

import { NextRequest, NextResponse } from 'next/server';

import { generateRAGResponse } from '@/lib/ai/rag';
import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use session user or body userId for public chat
    const body = await request.json();
    const { message, userId: bodyUserId } = body;
    const userId = user?.id || bodyUserId || 'anonymous';

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check feature flag
    const chatbotEnabled = isFeatureEnabled('ai-chatbot', userId);
    if (!chatbotEnabled) {
      return NextResponse.json({
        response: 'Maaf, fitur chatbot sedang tidak tersedia. Silakan hubungi customer service kami.',
      });
    }

    // Rate limiting
    const { success, limit, remaining } = await aiChatRateLimit.limit(userId);
    if (!success) {
      return NextResponse.json(
        {
          response: 'Terlalu banyak request. Silakan tunggu sebentar.',
          limit,
          remaining,
        },
        { status: 429 }
      );
    }

    // Generate response dengan RAG
    const response = await generateRAGResponse(message, userId);

    return NextResponse.json({
      response,
      remaining,
    });
  } catch (error) {
    logger.error('Chat error', error);
    return NextResponse.json(
      { error: 'Chat processing failed' },
      { status: 500 }
    );
  }
}

