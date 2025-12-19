/**
 * Weather Widget Component
 * Compact weather display for dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Cloud, CloudRain, Droplets, Sun, Wind } from 'lucide-react';
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
};

export function WeatherWidget({ locale }: WeatherWidgetProps) {
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

  // Weather widget is optional, so returning null when data unavailable is acceptable
  // This prevents showing broken UI when weather API fails
  if (!weatherData) {
    return null; // Widget is optional, returning null is acceptable
  }

  const hasAlerts = weatherData.alerts && weatherData.alerts.length > 0;

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
              {getWeatherIcon(weatherData.current.weather.main)}
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.round(weatherData.current.temp)}°C
                </div>
                <div className="text-xs text-slate-600 capitalize">
                  {weatherData.current.weather.description}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>{weatherData.current.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3.5 w-3.5" />
                  <span>{weatherData.current.wind_speed} m/s</span>
                </div>
              </div>
              {hasAlerts && (
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

