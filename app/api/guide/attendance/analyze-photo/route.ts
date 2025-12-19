/**
 * API: Analyze Photo for Happiness Detection
 * POST /api/guide/attendance/analyze-photo
 * Uses AI vision to detect happiness/sentiment from check-in photo
 */

import { NextRequest, NextResponse } from 'next/server';

import { analyzeImageSentiment } from '@/lib/ai/vision-sentiment';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Convert File to base64 for AI analysis
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Analyze image sentiment/happiness
    const sentimentResult = await analyzeImageSentiment(base64Image);

    // Map sentiment to 1-5 happiness scale
    // happy/positive -> 4-5, neutral -> 3, sad/negative -> 1-2
    let happiness: number;
    if (sentimentResult.sentiment === 'positive' || sentimentResult.confidence > 0.7) {
      happiness = sentimentResult.sentiment === 'very_positive' ? 5 : 4;
    } else if (sentimentResult.sentiment === 'negative' || sentimentResult.confidence < 0.3) {
      happiness = sentimentResult.sentiment === 'very_negative' ? 1 : 2;
    } else {
      happiness = 3; // neutral
    }

    logger.info('Photo analyzed for happiness', {
      guideId: user.id,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      happiness,
    });

    return NextResponse.json({
      happiness,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
    });
  } catch (error) {
    logger.error('Failed to analyze photo', error);
    // Return neutral happiness as fallback
    return NextResponse.json({
      happiness: 3,
      sentiment: 'neutral',
      confidence: 0.5,
    });
  }
});
