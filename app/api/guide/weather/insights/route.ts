/**
 * API: AI-Powered Weather Insights
 * GET /api/guide/weather/insights?lat=...&lng=...
 * 
 * Uses Google Gemini AI to provide weather-based recommendations:
 * - Safety recommendations
 * - Trip planning advice
 * - Equipment/clothing suggestions
 * - Sea condition predictions
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    // Get current weather data first
    const weatherRes = await fetch(`${request.nextUrl.origin}/api/guide/weather?lat=${lat}&lng=${lng}`);
    if (!weatherRes.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = (await weatherRes.json()) as {
      current: {
        temp: number;
        feels_like: number;
        humidity: number;
        wind_speed: number;
        weather: { main: string; description: string };
      };
      forecast: Array<{
        date: string;
        temp_max: number;
        temp_min: number;
        weather: { main: string; description: string };
        wind_speed: number;
      }>;
      alerts: Array<{ severity: string; message: string }>;
    };

    // Build context for AI
    const weatherContext = {
      current: {
        temperature: weatherData.current.temp,
        feelsLike: weatherData.current.feels_like,
        condition: weatherData.current.weather.main,
        description: weatherData.current.weather.description,
        humidity: weatherData.current.humidity,
        windSpeed: weatherData.current.wind_speed,
      },
      forecast: weatherData.forecast.slice(0, 3).map((f) => ({
        date: f.date,
        tempMax: f.temp_max,
        tempMin: f.temp_min,
        condition: f.weather.main,
        windSpeed: f.wind_speed,
      })),
      alerts: weatherData.alerts,
    };

    // Generate AI insights
    const prompt = `You are an AI assistant helping a tour guide in Indonesia plan safe and successful trips based on weather conditions.

Current Weather Conditions:
- Temperature: ${weatherContext.current.temperature}°C (feels like ${weatherContext.current.feelsLike}°C)
- Condition: ${weatherContext.current.condition} (${weatherContext.current.description})
- Humidity: ${weatherContext.current.humidity}%
- Wind Speed: ${weatherContext.current.windSpeed} km/h

3-Day Forecast:
${weatherContext.forecast.map((f) => `- ${f.date}: ${f.condition}, ${f.tempMin}°-${f.tempMax}°C, Wind: ${f.windSpeed} km/h`).join('\n')}

Active Alerts: ${weatherContext.alerts.length > 0 ? weatherData.alerts.map((a) => a.message).join('; ') : 'None'}

Provide insights in JSON format:
{
  "safety_assessment": {
    "level": "safe" | "caution" | "risky" | "unsafe",
    "reasoning": "brief explanation of safety level",
    "warnings": ["warning 1", "warning 2"]
  },
  "trip_recommendations": [
    {
      "type": "go_ahead" | "postpone" | "modify" | "cancel",
      "title": "recommendation title",
      "description": "detailed recommendation",
      "priority": "high" | "medium" | "low"
    }
  ],
  "equipment_suggestions": [
    {
      "item": "item name",
      "reason": "why this is needed",
      "priority": "essential" | "recommended" | "optional"
    }
  ],
  "sea_conditions": {
    "wave_height": "calm" | "moderate" | "rough" | "very_rough",
    "visibility": "excellent" | "good" | "poor",
    "advice": "detailed sea condition advice"
  },
  "best_times": {
    "today": "best time window for trips today",
    "next_3_days": "best days for trips in next 3 days"
  },
  "clothing_recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}

Return ONLY the JSON object, no additional text.`;

    let aiResponse: string;
    try {
      aiResponse = await generateContent(prompt);
    } catch (aiError) {
      logger.error('Failed to generate weather AI insights', aiError, { lat, lng });
      // Return fallback insights
      const fallbackInsights = {
        safety_assessment: {
          level: 'caution' as const,
          reasoning: 'Berdasarkan kondisi cuaca saat ini',
          warnings: weatherData.alerts.length > 0 
            ? weatherData.alerts.map((a) => a.message)
            : ['Perhatikan kondisi cuaca sebelum memulai trip'],
        },
        trip_recommendations: [],
        equipment_suggestions: [],
        sea_conditions: {
          wave_height: 'moderate' as const,
          visibility: 'good' as const,
          advice: 'Kondisi laut perlu diperhatikan berdasarkan kecepatan angin',
        },
        best_times: {
          today: 'Sesuaikan dengan kondisi cuaca',
          next_3_days: 'Periksa prakiraan cuaca sebelum memulai trip',
        },
        clothing_recommendations: [],
      };
      return NextResponse.json({
        insights: fallbackInsights,
        weatherContext,
      });
    }

    // Parse AI response
    let insights: Record<string, unknown>;
    try {
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleaned);
      
      // Validate insights structure
      if (!insights || typeof insights !== 'object') {
        throw new Error('Invalid AI response structure');
      }
    } catch (parseError) {
      logger.error('Failed to parse weather AI insights', parseError, {
        lat,
        lng,
        aiResponse: aiResponse.substring(0, 200),
      });
      // Return fallback insights
      insights = {
        safety_assessment: {
          level: 'caution',
          reasoning: 'Berdasarkan kondisi cuaca saat ini',
          warnings: weatherData.alerts.length > 0 
            ? weatherData.alerts.map((a) => a.message)
            : ['Perhatikan kondisi cuaca sebelum memulai trip'],
        },
        trip_recommendations: [],
        equipment_suggestions: [],
        sea_conditions: {
          wave_height: 'moderate',
          visibility: 'good',
          advice: 'Kondisi laut perlu diperhatikan berdasarkan kecepatan angin',
        },
        best_times: {
          today: 'Sesuaikan dengan kondisi cuaca',
          next_3_days: 'Periksa prakiraan cuaca sebelum memulai trip',
        },
        clothing_recommendations: [],
      };
    }

    return NextResponse.json({
      insights,
      weatherContext,
    });
  } catch (error) {
    logger.error('Failed to generate weather insights', error, { lat, lng });
    return NextResponse.json(
      { error: 'Failed to generate weather insights' },
      { status: 500 }
    );
  }
});
