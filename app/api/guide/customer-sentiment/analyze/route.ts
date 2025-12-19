/**
 * API: AI Customer Sentiment Real-time
 * POST /api/guide/customer-sentiment/analyze
 * 
 * Real-time sentiment dari interaksi, alerts, suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    analyzeCustomerSentiment,
    getSentimentSuggestions,
} from '@/lib/ai/customer-sentiment';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const analyzeSchema = z.object({
  text: z.string().optional(),
  rating: z.number().optional(),
  behavior: z.string().optional(),
  tripId: z.string().optional(),
  tripPhase: z.enum(['pre', 'during', 'post']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = analyzeSchema.parse(await request.json());

  try {
    // Analyze sentiment
    const sentiment = await analyzeCustomerSentiment({
      text: payload.text,
      rating: payload.rating,
      behavior: payload.behavior,
    });

    // Get suggestions if negative
    let suggestions: string[] = [];
    if (sentiment.alert) {
      suggestions = await getSentimentSuggestions(sentiment, {
        tripPhase: payload.tripPhase,
      });
    }

    // Save to database if tripId provided
    if (payload.tripId && sentiment.alert) {
      const client = supabase as unknown as any;
      await client.from('guide_customer_sentiment').insert({
        trip_id: payload.tripId,
        guide_id: user.id,
        sentiment: sentiment.sentiment,
        score: sentiment.score,
        keywords: sentiment.keywords,
        interaction_text: payload.text,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      sentiment,
      suggestions,
    });
  } catch (error) {
    logger.error('Failed to analyze customer sentiment', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal menganalisis sentiment' },
      { status: 500 }
    );
  }
});
