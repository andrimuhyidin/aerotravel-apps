/**
 * AI Customer Sentiment Real-time
 * Real-time sentiment dari interaksi, alerts, suggestions
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type SentimentAnalysis = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number; // 0-1
  keywords: string[];
  alert: boolean;
  suggestion?: string;
};

/**
 * Analyze real-time customer sentiment
 */
export async function analyzeCustomerSentiment(
  interaction: {
    text?: string;
    rating?: number;
    behavior?: string; // e.g., "complaining", "asking questions", "praising"
  }
): Promise<SentimentAnalysis> {
  try {
    const prompt = `Analyze customer sentiment from this interaction:

${interaction.text ? `Text: "${interaction.text}"` : ''}
${interaction.rating ? `Rating: ${interaction.rating}/5` : ''}
${interaction.behavior ? `Behavior: ${interaction.behavior}` : ''}

Provide sentiment analysis in JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": -1 to 1 (negative to positive),
  "confidence": 0-1,
  "keywords": ["keyword1", "keyword2"],
  "alert": true/false (true if negative sentiment detected),
  "suggestion": "what guide should do" (if alert is true)
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleaned) as SentimentAnalysis;

      // Validate based on rating if provided
      if (interaction.rating !== undefined) {
        if (interaction.rating >= 4 && analysis.sentiment !== 'positive') {
          analysis.sentiment = 'positive';
          analysis.score = 0.7;
        } else if (interaction.rating <= 2 && analysis.sentiment !== 'negative') {
          analysis.sentiment = 'negative';
          analysis.score = -0.7;
          analysis.alert = true;
        }
      }

      return analysis;
    } catch {
      return getFallbackSentiment(interaction);
    }
  } catch (error) {
    logger.error('Failed to analyze customer sentiment', error);
    return getFallbackSentiment(interaction);
  }
}

/**
 * Get suggestions based on negative sentiment
 */
export async function getSentimentSuggestions(
  sentiment: SentimentAnalysis,
  context?: {
    tripPhase?: 'pre' | 'during' | 'post';
    issueCategory?: string;
  }
): Promise<string[]> {
  if (!sentiment.alert || sentiment.sentiment !== 'negative') {
    return [];
  }

  try {
    const prompt = `A tour guide detected negative customer sentiment. Provide actionable suggestions:

Sentiment: ${sentiment.sentiment}
Keywords: ${sentiment.keywords.join(', ')}
${context?.tripPhase ? `Trip Phase: ${context.tripPhase}` : ''}
${context?.issueCategory ? `Issue Category: ${context.issueCategory}` : ''}

Provide 3-5 practical suggestions for the guide to improve the situation.

Return JSON array: ["suggestion 1", "suggestion 2", ...]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleaned) as string[];
      return Array.isArray(suggestions) ? suggestions : [];
    } catch {
      return getDefaultSuggestions(sentiment);
    }
  } catch (error) {
    logger.error('Failed to get sentiment suggestions', error);
    return getDefaultSuggestions(sentiment);
  }
}

function getFallbackSentiment(interaction: {
  text?: string;
  rating?: number;
  behavior?: string;
}): SentimentAnalysis {
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  let score = 0;
  let alert = false;

  if (interaction.rating !== undefined) {
    if (interaction.rating >= 4) {
      sentiment = 'positive';
      score = 0.7;
    } else if (interaction.rating <= 2) {
      sentiment = 'negative';
      score = -0.7;
      alert = true;
    }
  } else if (interaction.text) {
    const text = interaction.text.toLowerCase();
    const negativeWords = ['buruk', 'jelek', 'tidak puas', 'kecewa', 'bad', 'poor'];
    const positiveWords = ['bagus', 'puas', 'senang', 'mantap', 'good', 'great'];

    const negativeCount = negativeWords.filter((w) => text.includes(w)).length;
    const positiveCount = positiveWords.filter((w) => text.includes(w)).length;

    if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.5;
      alert = true;
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.5;
    }
  }

  return {
    sentiment,
    score,
    confidence: 0.6,
    keywords: [],
    alert,
  };
}

function getDefaultSuggestions(sentiment: SentimentAnalysis): string[] {
  return [
    'Acknowledge the concern and show empathy',
    'Ask clarifying questions to understand the issue better',
    'Offer solutions or alternatives if possible',
    'Escalate to operations if needed',
  ];
}
