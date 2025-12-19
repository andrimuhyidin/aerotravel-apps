/**
 * AI Feedback Analyzer
 * Auto-summarize, sentiment analysis, action items extraction
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type FeedbackAnalysis = {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0-1
  keyPoints: string[];
  actionItems: Array<{
    item: string;
    priority: 'high' | 'medium' | 'low';
    category: 'service' | 'safety' | 'communication' | 'equipment' | 'other';
  }>;
  trends: string[];
  confidence: number;
};

/**
 * Analyze single feedback
 */
export async function analyzeFeedback(
  feedbackText: string,
  rating?: number
): Promise<FeedbackAnalysis> {
  try {
    const prompt = `Analyze this customer feedback:

Feedback Text: "${feedbackText}"
${rating ? `Rating: ${rating}/5` : ''}

Provide analysis in JSON format:
{
  "summary": "brief summary (2-3 sentences)",
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": 0-1,
  "keyPoints": ["point 1", "point 2"],
  "actionItems": [
    {
      "item": "action item",
      "priority": "high" | "medium" | "low",
      "category": "service" | "safety" | "communication" | "equipment" | "other"
    }
  ],
  "trends": ["trend 1", "trend 2"],
  "confidence": 0-1
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleaned) as FeedbackAnalysis;

      // Validate sentiment score based on rating if provided
      if (rating !== undefined) {
        if (rating >= 4 && analysis.sentiment !== 'positive') {
          analysis.sentiment = 'positive';
          analysis.sentimentScore = Math.max(analysis.sentimentScore, 0.7);
        } else if (rating <= 2 && analysis.sentiment !== 'negative') {
          analysis.sentiment = 'negative';
          analysis.sentimentScore = Math.min(analysis.sentimentScore, 0.4);
        }
      }

      return analysis;
    } catch {
      // Fallback analysis
      return getFallbackAnalysis(feedbackText, rating);
    }
  } catch (error) {
    logger.error('Failed to analyze feedback', error);
    return getFallbackAnalysis(feedbackText, rating);
  }
}

/**
 * Analyze multiple feedbacks for trends
 */
export async function analyzeFeedbackTrends(
  feedbacks: Array<{ text: string; rating?: number; createdAt: string }>
): Promise<{
  overallSentiment: 'positive' | 'neutral' | 'negative';
  averageSentimentScore: number;
  commonThemes: Array<{ theme: string; frequency: number; examples: string[] }>;
  topActionItems: Array<{ item: string; priority: 'high' | 'medium' | 'low'; count: number }>;
  trendDirection: 'improving' | 'stable' | 'declining';
}> {
  try {
    const feedbackList = feedbacks
      .map((f, idx) => `${idx + 1}. Rating: ${f.rating || 'N/A'}/5\n   Feedback: "${f.text}"`)
      .join('\n\n');

    const prompt = `Analyze these customer feedbacks for trends:

Feedbacks:
${feedbackList}

Provide trend analysis in JSON format:
{
  "overallSentiment": "positive" | "neutral" | "negative",
  "averageSentimentScore": 0-1,
  "commonThemes": [
    {
      "theme": "theme name",
      "frequency": number (how many times mentioned),
      "examples": ["example 1", "example 2"]
    }
  ],
  "topActionItems": [
    {
      "item": "action item",
      "priority": "high" | "medium" | "low",
      "count": number (how many times mentioned)
    }
  ],
  "trendDirection": "improving" | "stable" | "declining"
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-pro');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Fallback
      const ratings = feedbacks.map((f) => f.rating || 3).filter((r) => r !== undefined);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 3;

      return {
        overallSentiment: avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral',
        averageSentimentScore: avgRating / 5,
        commonThemes: [],
        topActionItems: [],
        trendDirection: 'stable' as const,
      };
    }
  } catch (error) {
    logger.error('Failed to analyze feedback trends', error);
    return {
      overallSentiment: 'neutral',
      averageSentimentScore: 0.5,
      commonThemes: [],
      topActionItems: [],
      trendDirection: 'stable',
    };
  }
}

function getFallbackAnalysis(feedbackText: string, rating?: number): FeedbackAnalysis {
  const text = feedbackText.toLowerCase();
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  let sentimentScore = 0.5;

  // Simple keyword-based sentiment
  const positiveWords = ['bagus', 'puas', 'senang', 'mantap', 'recommend', 'good', 'great', 'excellent'];
  const negativeWords = ['buruk', 'tidak puas', 'kecewa', 'jelek', 'bad', 'poor', 'terrible'];

  const positiveCount = positiveWords.filter((w) => text.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => text.includes(w)).length;

  if (rating !== undefined) {
    sentimentScore = rating / 5;
    sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = 0.7;
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = 0.3;
  }

  return {
    summary: feedbackText.length > 100 ? `${feedbackText.substring(0, 100)}...` : feedbackText,
    sentiment,
    sentimentScore,
    keyPoints: [],
    actionItems: [],
    trends: [],
    confidence: 0.5,
  };
}
