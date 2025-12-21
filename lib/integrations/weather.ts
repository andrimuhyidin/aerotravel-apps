/**
 * Weather Service Integration
 * Handles OpenWeather API integration and weather data caching
 */

import { openDB } from 'idb';

import { logger } from '@/lib/utils/logger';

export type WeatherData = {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number; // km/h
    pressure: number;
    visibility?: number; // km
    sunrise: number;
    sunset: number;
    weather: {
      main: string;
      description: string;
      icon: string;
      id: number;
    };
  };
  forecast?: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    weather: {
      main: string;
      description: string;
      icon: string;
      id: number;
    };
    wind_speed: number;
    humidity?: number;
  }>;
  alerts?: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
};

/**
 * Estimate wave height from wind speed (rough approximation)
 * Formula: wave_height ≈ wind_speed_kmh / 20 (for open sea)
 */
export function estimateWaveHeight(windSpeedKmh: number): number {
  // Rough approximation: wave height in meters
  // Calm (0-10 km/h): 0-0.5m
  // Light (10-20 km/h): 0.5-1m
  // Moderate (20-30 km/h): 1-1.5m
  // Strong (30-40 km/h): 1.5-2m
  // Very Strong (>40 km/h): >2m
  
  if (windSpeedKmh <= 10) return 0.3;
  if (windSpeedKmh <= 20) return 0.8;
  if (windSpeedKmh <= 30) return 1.3;
  if (windSpeedKmh <= 40) return 1.8;
  return Math.min(2.5, windSpeedKmh / 15); // Cap at 2.5m for safety
}

/**
 * Get weather data from API
 */
export async function getWeatherData(
  lat: number,
  lng: number,
  date?: string
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    if (date) {
      params.append('date', date);
    }

    const response = await fetch(`/api/guide/weather?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = (await response.json()) as WeatherData;
    return data;
  } catch (error) {
    logger.error('Failed to fetch weather data', error, { lat, lng, date });
    return null;
  }
}

/**
 * Extract risk assessment data from weather
 */
export function extractRiskDataFromWeather(weather: WeatherData): {
  wave_height?: number;
  wind_speed?: number;
  weather_condition?: 'clear' | 'cloudy' | 'rainy' | 'stormy';
} {
  const windSpeedKmh = weather.current.wind_speed;
  const estimatedWaveHeight = estimateWaveHeight(windSpeedKmh);
  
  // Map weather condition
  let weatherCondition: 'clear' | 'cloudy' | 'rainy' | 'stormy' = 'clear';
  const weatherMain = weather.current.weather.main.toLowerCase();
  if (weatherMain.includes('storm') || weatherMain.includes('thunder')) {
    weatherCondition = 'stormy';
  } else if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
    weatherCondition = 'rainy';
  } else if (weatherMain.includes('cloud')) {
    weatherCondition = 'cloudy';
  }

  return {
    wave_height: estimatedWaveHeight,
    wind_speed: windSpeedKmh,
    weather_condition: weatherCondition,
  };
}

/**
 * Cache weather data in IndexedDB (for offline use)
 */
export async function cacheWeatherData(
  key: string,
  data: WeatherData
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await openDB('weather-cache', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('weather')) {
          database.createObjectStore('weather', { keyPath: 'key' });
        }
      },
    });
    
    await db.put('weather', {
      key,
      data,
      cachedAt: Date.now(),
    });
  } catch (error) {
    logger.warn('Failed to cache weather data', { error });
  }
}

/**
 * Get cached weather data
 */
export async function getCachedWeatherData(
  key: string
): Promise<WeatherData | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const db = await openDB('weather-cache', 1);
    const cached = (await db.get('weather', key)) as { key: string; data: WeatherData; cachedAt: number } | undefined;
    
    if (cached && Date.now() - cached.cachedAt < 30 * 60 * 1000) {
      // Cache valid for 30 minutes
      return cached.data;
    }
    
    return null;
  } catch (error) {
    logger.warn('Failed to get cached weather data', { error });
    return null;
  }
}

