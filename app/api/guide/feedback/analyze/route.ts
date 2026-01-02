/**
 * API: AI Feedback Analyzer
 * POST /api/guide/feedback/analyze
 * 
 * Auto-summarize, sentiment analysis, action items extraction
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { analyzeFeedback, analyzeFeedbackTrends } from '@/lib/ai/feedback-analyzer';
import { withErrorHandler } from '@/lib/api/error-handler';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const analyzeSchema = z.object({
  type: z.enum(['single', 'trends']),
  feedbackId: z.string().optional(), // For single analysis
  feedbackText: z.string().optional(), // For single analysis
  rating: z.number().optional(), // For single analysis
  guideId: z.string().optional(), // For trends analysis
  limit: z.number().default(20), // For trends analysis
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
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'analisis feedback');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const payload = analyzeSchema.parse(await request.json());
  const client = supabase as unknown as any;

  try {
    if (payload.type === 'single') {
      // Analyze single feedback
      if (!payload.feedbackText) {
        return NextResponse.json({ error: 'Feedback text required' }, { status: 400 });
      }

      const analysis = await analyzeFeedback(payload.feedbackText, payload.rating);

      // If feedbackId provided, save analysis to database
      if (payload.feedbackId) {
        await client
          .from('guide_feedback_analysis')
          .upsert({
            feedback_id: payload.feedbackId,
            guide_id: user.id,
            summary: analysis.summary,
            sentiment: analysis.sentiment,
            sentiment_score: analysis.sentimentScore,
            key_points: analysis.keyPoints,
            action_items: analysis.actionItems,
            confidence: analysis.confidence,
            updated_at: new Date().toISOString(),
          });
      }

      return NextResponse.json({ analysis });
    } else {
      // Analyze trends
      const guideId = payload.guideId || user.id;

      const { data: feedbacks } = await client
        .from('guide_feedback')
        .select('id, feedback_text, rating, created_at')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false })
        .limit(payload.limit);

      const trends = await analyzeFeedbackTrends(
        (feedbacks || []).map((f: any) => ({
          text: f.feedback_text,
          rating: f.rating,
          createdAt: f.created_at,
        }))
      );

      return NextResponse.json({ trends });
    }
  } catch (error) {
    logger.error('Failed to analyze feedback', error, {
      guideId: user.id,
      type: payload.type,
    });
    return NextResponse.json(
      { error: 'Gagal menganalisis feedback' },
      { status: 500 }
    );
  }
});
