/**
 * Image Sentiment Analysis
 * Analyze image to detect happiness/emotion/sentiment using Gemini Vision
 */

import { analyzeImage } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type SentimentResult = {
  sentiment:
    | 'very_positive'
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'very_negative';
  confidence: number; // 0-1
  detectedEmotions?: string[];
};

type GeminiSentimentResponse = {
  sentiment: string;
  confidence: number;
  emotions: string[];
};

const SENTIMENT_PROMPT = `Analyze this image and detect the emotional sentiment/mood of the people in it.

Consider:
- Facial expressions (smiling, frowning, neutral)
- Body language and posture
- Overall atmosphere and environment
- Group dynamics if multiple people

Return ONLY a JSON object in this exact format, no other text:
{
  "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
  "confidence": 0.0-1.0,
  "emotions": ["happy", "excited", "relaxed", etc.]
}

Guidelines:
- very_positive: Big smiles, excitement, celebration
- positive: Smiling, content, enjoying
- neutral: No clear emotion, calm
- negative: Frowning, upset, uncomfortable
- very_negative: Angry, crying, distressed

If no people are visible, analyze the overall mood of the scene.`;

/**
 * Analyze image sentiment using Gemini Vision AI
 * Uses Google AI Studio (Gemini) for emotion/sentiment detection
 */
export async function analyzeImageSentiment(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<SentimentResult> {
  try {
    logger.info('[Vision] Analyzing image sentiment with Gemini');

    const result = await analyzeImage(base64Image, mimeType, SENTIMENT_PROMPT);

    // Parse the JSON response
    const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as GeminiSentimentResponse;

    // Validate and normalize sentiment value
    const validSentiments = ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'] as const;
    const sentiment = validSentiments.includes(parsed.sentiment as typeof validSentiments[number])
      ? (parsed.sentiment as SentimentResult['sentiment'])
      : 'neutral';

    // Normalize confidence to 0-1 range
    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

    logger.info('[Vision] Sentiment analysis complete', {
      sentiment,
      confidence,
      emotionsCount: parsed.emotions?.length || 0,
    });

    return {
      sentiment,
      confidence,
      detectedEmotions: parsed.emotions || [],
    };
  } catch (error) {
    logger.error('[Vision] Failed to analyze sentiment', error);
    
    // Return neutral as fallback on error
    return {
      sentiment: 'neutral',
      confidence: 0.3,
      detectedEmotions: [],
    };
  }
}
