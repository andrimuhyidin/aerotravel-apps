/**
 * AI Route & Itinerary Optimizer
 * Dynamic suggestions, time optimization, alternative routes
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type ItineraryItem = {
  time: string;
  activity: string;
  location?: string;
  duration?: number; // minutes
  estimatedDuration?: number;
};

export type RouteOptimization = {
  optimized: boolean;
  originalDuration: number; // minutes
  optimizedDuration: number; // minutes
  timeSaved: number; // minutes
  suggestions: Array<{
    type: 'reorder' | 'skip' | 'combine' | 'alternative';
    item: string;
    reason: string;
    impact: string;
  }>;
  alternativeRoutes?: Array<{
    name: string;
    description: string;
    duration: number;
    advantages: string[];
    disadvantages: string[];
  }>;
};

/**
 * Optimize itinerary based on context
 */
export async function optimizeItinerary(
  itinerary: ItineraryItem[],
  context?: {
    weather?: {
      condition: string;
      hasAlert: boolean;
    };
    totalPax?: number;
    currentTime?: string;
    constraints?: string[];
  }
): Promise<RouteOptimization> {
  try {
    const itineraryStr = itinerary
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.time} - ${item.activity}${item.location ? ` @ ${item.location}` : ''}${item.duration ? ` (${item.duration} min)` : ''}`
      )
      .join('\n');

    const contextStr = context
      ? `\nContext:\n${context.weather ? `- Weather: ${context.weather.condition}${context.weather.hasAlert ? ' (ALERT)' : ''}\n` : ''}${context.totalPax ? `- Passengers: ${context.totalPax}\n` : ''}${context.currentTime ? `- Current Time: ${context.currentTime}\n` : ''}${context.constraints ? `- Constraints: ${context.constraints.join(', ')}\n` : ''}`
      : '';

    const prompt = `Optimize this trip itinerary:

Itinerary:
${itineraryStr}
${contextStr}

Provide optimization suggestions:
1. Reorder activities for better flow
2. Skip activities if weather/conditions don't allow
3. Combine activities to save time
4. Suggest alternative routes if beneficial

Return JSON:
{
  "optimized": true/false,
  "originalDuration": number (total minutes),
  "optimizedDuration": number (total minutes),
  "timeSaved": number (minutes saved),
  "suggestions": [
    {
      "type": "reorder" | "skip" | "combine" | "alternative",
      "item": "activity name",
      "reason": "why this change",
      "impact": "expected impact"
    }
  ],
  "alternativeRoutes": [
    {
      "name": "route name",
      "description": "description",
      "duration": number (minutes),
      "advantages": ["advantage 1"],
      "disadvantages": ["disadvantage 1"]
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-pro');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const optimization = JSON.parse(cleaned) as RouteOptimization;

      // Calculate durations if not provided
      if (!optimization.originalDuration) {
        optimization.originalDuration = itinerary.reduce(
          (sum, item) => sum + (item.duration || item.estimatedDuration || 60),
          0
        );
      }

      if (!optimization.optimizedDuration) {
        optimization.optimizedDuration = optimization.originalDuration;
      }

      optimization.timeSaved = optimization.originalDuration - optimization.optimizedDuration;

      return optimization;
    } catch {
      return getFallbackOptimization(itinerary);
    }
  } catch (error) {
    logger.error('Failed to optimize itinerary', error);
    return getFallbackOptimization(itinerary);
  }
}

function getFallbackOptimization(itinerary: ItineraryItem[]): RouteOptimization {
  const totalDuration = itinerary.reduce(
    (sum, item) => sum + (item.duration || item.estimatedDuration || 60),
    0
  );

  return {
    optimized: false,
    originalDuration: totalDuration,
    optimizedDuration: totalDuration,
    timeSaved: 0,
    suggestions: [],
  };
}
