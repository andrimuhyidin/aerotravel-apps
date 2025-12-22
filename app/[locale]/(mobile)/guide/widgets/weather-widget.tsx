/**
 * Weather Widget Component
 * Compact weather display for dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Cloud, CloudRain, Droplets, Sun, Wind } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type WeatherData = {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
  };
  alerts: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
};

type WeatherWidgetProps = {
  locale: string;
  compact?: boolean;
};

export function WeatherWidget({ locale, compact = false }: WeatherWidgetProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocation({ lat: -5.45, lng: 105.27 }); // Default Bandar Lampung
        }
      );
    } else {
      setLocation({ lat: -5.45, lng: 105.27 });
    }
  }, []);

  const { data: weatherData, isLoading } = useQuery<WeatherData>({
    queryKey: [...queryKeys.guide.all, 'weather', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return null;
      const res = await fetch(`/api/guide/weather?lat=${location.lat}&lng=${location.lng}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    enabled: !!location,
    staleTime: 300000, // 5 minutes
  });

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'clear':
        return <Sun className="h-6 w-6 text-amber-500" />;
      case 'clouds':
        return <Cloud className="h-6 w-6 text-slate-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Cloud className="h-6 w-6 text-slate-400" />;
    }
  };

  const hasAlerts = weatherData?.alerts && Array.isArray(weatherData.alerts) && weatherData.alerts.length > 0;
  const currentWeather = weatherData?.current;
  const currentTemp = currentWeather?.temp ?? 0;
  const currentFeelsLike = currentWeather?.feels_like ?? currentTemp;
  const currentHumidity = currentWeather?.humidity ?? 0;
  const currentWindSpeed = currentWeather?.wind_speed ?? 0;
  const weatherMain = currentWeather?.weather?.main ?? 'clear';
  const weatherDescription = currentWeather?.weather?.description ?? '';

  // Show fallback UI if weather data is not available
  if (!weatherData && !isLoading && location) {
    // Compact version fallback
    if (compact) {
      return (
        <Link href={`/${locale}/guide/weather`} className="flex items-center gap-2 min-w-0 flex-1 group">
          <Cloud className="h-6 w-6 text-slate-400" />
          <div className="flex min-w-0 flex-col flex-1">
            <span className="text-xs font-medium text-slate-500">Cuaca</span>
            <span className="text-sm font-semibold text-slate-600">Tidak tersedia</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </Link>
      );
    }
    // Full version fallback
    return (
      <Link href={`/${locale}/guide/weather`} className="block transition-transform active:scale-[0.98]">
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Cloud className="h-6 w-6 text-slate-400" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Cuaca</div>
                <div className="text-xs text-slate-600">Tidak tersedia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // If no weather data and still loading or no location, show loading state
  if (!weatherData) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Cloud className="h-6 w-6 text-slate-300 animate-pulse" />
          <div className="flex min-w-0 flex-col flex-1">
            <span className="text-xs font-medium text-slate-400">Cuaca</span>
            <span className="text-sm font-semibold text-slate-400">Memuat...</span>
          </div>
        </div>
      );
    }
    return null; // Full version already has loading state above
  }

  // Compact version for combined status + weather widget
  if (compact) {
    return (
      <Link href={`/${locale}/guide/weather`} className="flex items-center gap-2 min-w-0 flex-1 group">
        {getWeatherIcon(weatherMain)}
        <div className="flex min-w-0 flex-col flex-1">
          <span className="text-xs font-medium text-slate-500">Cuaca</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-slate-900">
              {Math.round(currentTemp)}°C
            </span>
            {hasAlerts && weatherData?.alerts && (
              <span className="text-[10px] font-medium text-amber-700 flex items-center gap-0.5">
                <span className="text-amber-600">⚠️</span>
                <span>{weatherData.alerts.length} peringatan</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </Link>
    );
  }

  // Full version
  if (isLoading || !location) {
    return (
      <Link href={`/${locale}/guide/weather`} className="block">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}/guide/weather`} className="block transition-transform active:scale-[0.98]">
      <Card
        className={cn(
          'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm',
          hasAlerts && 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weatherMain)}
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.round(currentTemp)}°C
                </div>
                <div className="text-xs text-slate-600 capitalize">
                  {weatherDescription}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>{currentHumidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3.5 w-3.5" />
                  <span>{currentWindSpeed} m/s</span>
                </div>
              </div>
              {hasAlerts && weatherData?.alerts && (
                <div className="mt-1 text-xs font-medium text-amber-700">
                  ⚠️ {weatherData.alerts.length} Peringatan
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

