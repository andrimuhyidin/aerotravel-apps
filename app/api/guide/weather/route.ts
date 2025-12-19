/**
 * API: Weather Alerts for Trip Planning
 * GET /api/guide/weather?lat=...&lng=...&date=...
 * 
 * Integrates with OpenWeatherMap API for weather forecasts
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const date = searchParams.get('date'); // YYYY-MM-DD

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    logger.warn('OPENWEATHER_API_KEY not configured, returning mock data');
    // Return mock data for development
    const today = new Date();
    const mockForecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      mockForecast.push({
        date: date.toISOString().split('T')[0],
        temp_max: 28 + Math.floor(Math.random() * 5),
        temp_min: 23 + Math.floor(Math.random() * 3),
        weather: { main: i % 3 === 0 ? 'Rain' : 'Clear', description: i % 3 === 0 ? 'Hujan' : 'Cerah', icon: i % 3 === 0 ? '10d' : '01d', id: i % 3 === 0 ? 500 : 800 },
        wind_speed: 10 + Math.floor(Math.random() * 10),
        humidity: 70 + Math.floor(Math.random() * 15),
      });
    }

    return NextResponse.json({
      location: {
        name: 'Bandar Lampung',
        country: 'ID',
      },
      current: {
        temp: 28,
        feels_like: 30,
        humidity: 75,
        wind_speed: 15,
        pressure: 1013,
        visibility: 10,
        sunrise: Math.floor(today.setHours(6, 0, 0, 0) / 1000),
        sunset: Math.floor(today.setHours(18, 0, 0, 0) / 1000),
        weather: { main: 'Clear', description: 'Cerah', icon: '01d', id: 800 },
      },
      forecast: mockForecast,
      alerts: [],
    });
  }

  try {
    // Get current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=id`
    );

    if (!currentResponse.ok) {
      throw new Error(`OpenWeather API error: ${currentResponse.status}`);
    }

    const currentData = (await currentResponse.json()) as {
      name: string;
      sys: { country: string; sunrise: number; sunset: number };
      main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
      };
      wind: { speed: number };
      weather: Array<{ main: string; description: string; icon: string; id: number }>;
      visibility?: number;
    };

    if (!currentData.weather || currentData.weather.length === 0) {
      throw new Error('Invalid weather data received');
    }

    // Get 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=id`
    );

    if (!forecastResponse.ok) {
      throw new Error(`OpenWeather Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = (await forecastResponse.json()) as {
      list: Array<{
        dt: number;
        main: { temp_max: number; temp_min: number; humidity?: number };
        wind: { speed: number };
        weather: Array<{ main: string; description: string; icon: string; id: number }>;
      }>;
    };

    // Process forecast - group by date and get daily max/min
    const forecastByDate = new Map<string, {
      date: string;
      temp_max: number;
      temp_min: number;
      weather: { main: string; description: string; icon: string; id: number };
      wind_speed: number;
      humidity?: number;
    }>();

    forecastData.list.forEach((item) => {
      if (!item.weather || item.weather.length === 0) return;
      
      const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dateStr) return;
      
      const itemDate: string = dateStr;
      const existing = forecastByDate.get(itemDate);

      if (!existing) {
        forecastByDate.set(itemDate, {
          date: itemDate,
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          weather: item.weather[0]!,
          wind_speed: item.wind.speed,
          humidity: item.main.humidity,
        });
      } else {
        // Update max/min temps
        if (item.main.temp_max > existing.temp_max) {
          existing.temp_max = item.main.temp_max;
        }
        if (item.main.temp_min < existing.temp_min) {
          existing.temp_min = item.main.temp_min;
        }
      }
    });

    const processedForecast = Array.from(forecastByDate.values()).slice(0, 7);

    // Generate alerts based on weather conditions
    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    const currentWeather = currentData.weather[0];
    if (currentWeather && (currentWeather.main === 'Rain' || currentWeather.main === 'Thunderstorm')) {
      alerts.push({
        type: 'weather',
        severity: 'high',
        message: 'Hujan atau badai terdeteksi. Perhatikan kondisi laut dan keselamatan trip.',
      });
    }

    if (currentData.wind.speed > 20) {
      alerts.push({
        type: 'wind',
        severity: 'medium',
        message: `Angin kencang (${Math.round(currentData.wind.speed * 3.6)} km/h). Perhatikan kondisi perairan.`,
      });
    }

    if (currentData.main.temp > 35) {
      alerts.push({
        type: 'temperature',
        severity: 'low',
        message: 'Suhu tinggi. Pastikan hidrasi dan perlindungan dari sinar matahari.',
      });
    }

    return NextResponse.json({
      location: {
        name: currentData.name,
        country: currentData.sys.country,
      },
      current: {
        temp: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
        pressure: currentData.main.pressure,
        visibility: currentData.visibility ? Math.round(currentData.visibility / 1000) : undefined, // Convert to km
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
        weather: currentWeather,
      },
      forecast: processedForecast.map((item) => ({
        date: item.date,
        temp_max: Math.round(item.temp_max),
        temp_min: Math.round(item.temp_min),
        weather: item.weather,
        wind_speed: Math.round(item.wind_speed * 3.6),
        humidity: item.humidity,
      })),
      alerts,
    });
  } catch (error) {
    logger.error('Failed to fetch weather data', error, { lat, lng, date });
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
});

