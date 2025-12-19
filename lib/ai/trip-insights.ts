/**
 * AI Predictive Trip Insights
 * Prediksi masalah, resource planning, route optimization
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type TripInsightContext = {
  tripId: string;
  tripDate: string;
  totalPax: number;
  weather?: {
    temp: number;
    description: string;
    windSpeed?: number;
    hasAlert: boolean;
  };
  itinerary?: Array<{
    time: string;
    activity: string;
    location?: string;
  }>;
  manifest?: {
    total: number;
    children: number;
    withAllergies: number;
  };
  historicalData?: {
    similarTrips: number;
    averageDelay: number;
    commonIssues: string[];
  };
};

export type TripInsight = {
  type: 'delay' | 'resource' | 'route' | 'safety' | 'weather';
  title: string;
  description: string;
  probability: number; // 0-100
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  confidence: number; // 0-1
};

/**
 * Get predictive trip insights
 */
export async function getPredictiveTripInsights(
  context: TripInsightContext
): Promise<TripInsight[]> {
  try {
    const contextString = buildInsightContext(context);

    const prompt = `${contextString}

Based on this trip information, predict potential issues and provide insights.

Analyze:
1. Weather impact on trip schedule
2. Resource needs (equipment, supplies) based on passenger count and type
3. Route optimization opportunities
4. Safety concerns
5. Potential delays

Return JSON array:
[
  {
    "type": "delay" | "resource" | "route" | "safety" | "weather",
    "title": "insight title",
    "description": "detailed description",
    "probability": 0-100,
    "severity": "low" | "medium" | "high",
    "recommendations": ["rec 1", "rec 2"],
    "confidence": 0-1
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-pro');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const insights = JSON.parse(cleaned) as TripInsight[];

      // Validate and filter insights
      return insights
        .filter((insight) => insight.probability > 20) // Only show if >20% probability
        .sort((a, b) => {
          // Sort by severity and probability
          const severityOrder = { high: 3, medium: 2, low: 1 };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[b.severity] - severityOrder[a.severity];
          }
          return b.probability - a.probability;
        })
        .slice(0, 5); // Top 5 insights
    } catch {
      // Fallback insights
      return getFallbackInsights(context);
    }
  } catch (error) {
    logger.error('Failed to get predictive trip insights', error);
    return getFallbackInsights(context);
  }
}

/**
 * Get resource planning suggestions
 */
export async function getResourcePlanningSuggestions(
  context: TripInsightContext
): Promise<Array<{
  item: string;
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}>> {
  try {
    const prompt = `Based on this trip information, suggest resource planning:

Trip Date: ${context.tripDate}
Total Passengers: ${context.totalPax}
${context.manifest ? `- Children: ${context.manifest.children}\n- With Allergies: ${context.manifest.withAllergies}` : ''}
${context.weather ? `Weather: ${context.weather.description}, ${context.weather.temp}°C` : ''}

Suggest equipment and supplies needed:
- Life jackets (1 per passenger + extras)
- Safety equipment
- Food/water quantities
- Medical supplies
- Weather protection

Return JSON array:
[
  {
    "item": "item name",
    "quantity": number,
    "reason": "why needed",
    "priority": "high" | "medium" | "low"
  }
]

Return ONLY the JSON array, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleaned) as Array<{
        item: string;
        quantity: number;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }>;

      return Array.isArray(suggestions) ? suggestions : [];
    } catch {
      // Fallback
      return [
        {
          item: 'Life Jackets',
          quantity: context.totalPax + 3, // Extra for safety
          reason: `1 per passenger + 3 extras for safety`,
          priority: 'high' as const,
        },
        {
          item: 'First Aid Kit',
          quantity: 1,
          reason: 'Essential safety equipment',
          priority: 'high' as const,
        },
      ];
    }
  } catch (error) {
    logger.error('Failed to get resource planning suggestions', error);
    return [];
  }
}

function buildInsightContext(context: TripInsightContext): string {
  let str = `TRIP INFORMATION:
- Trip ID: ${context.tripId}
- Date: ${context.tripDate}
- Total Passengers: ${context.totalPax}
`;

  if (context.manifest) {
    str += `- Children: ${context.manifest.children}
- With Allergies: ${context.manifest.withAllergies}
`;
  }

  if (context.weather) {
    str += `\nWEATHER:
- Temperature: ${context.weather.temp}°C
- Condition: ${context.weather.description}
${context.weather.windSpeed ? `- Wind Speed: ${context.weather.windSpeed} km/h` : ''}
${context.weather.hasAlert ? '⚠️ Weather Alert Active' : ''}
`;
  }

  if (context.itinerary && context.itinerary.length > 0) {
    str += `\nITINERARY:
`;
    context.itinerary.forEach((item) => {
      str += `${item.time} - ${item.activity}${item.location ? ` @ ${item.location}` : ''}\n`;
    });
  }

  if (context.historicalData) {
    str += `\nHISTORICAL DATA:
- Similar Trips: ${context.historicalData.similarTrips}
- Average Delay: ${context.historicalData.averageDelay} minutes
- Common Issues: ${context.historicalData.commonIssues.join(', ')}
`;
  }

  return str;
}

function getFallbackInsights(context: TripInsightContext): TripInsight[] {
  const insights: TripInsight[] = [];

  // Weather insight
  if (context.weather?.hasAlert) {
    insights.push({
      type: 'weather',
      title: 'Weather Alert',
      description: `Weather conditions may affect trip: ${context.weather.description}`,
      probability: 70,
      severity: 'high',
      recommendations: [
        'Monitor weather updates closely',
        'Prepare alternative itinerary if needed',
        'Ensure all safety equipment is ready',
      ],
      confidence: 0.8,
    });
  }

  // Resource insight for large groups
  if (context.totalPax > 20) {
    insights.push({
      type: 'resource',
      title: 'Large Group - Extra Resources Needed',
      description: `With ${context.totalPax} passengers, ensure adequate resources`,
      probability: 90,
      severity: 'medium',
      recommendations: [
        `Prepare ${context.totalPax + 5} life jackets (extra for safety)`,
        'Ensure sufficient food and water',
        'Plan for longer boarding/disembarking times',
      ],
      confidence: 0.9,
    });
  }

  // Children insight
  if (context.manifest && context.manifest.children > 0) {
    insights.push({
      type: 'safety',
      title: 'Children on Board',
      description: `${context.manifest.children} child(ren) require extra supervision`,
      probability: 100,
      severity: 'high',
      recommendations: [
        'Assign extra supervision for children',
        'Ensure child-sized life jackets available',
        'Plan child-friendly activities',
      ],
      confidence: 1.0,
    });
  }

  return insights;
}
