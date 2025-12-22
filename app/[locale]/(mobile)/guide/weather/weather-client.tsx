'use client';

/**
 * Weather Client Component - Enhanced
 * Modern weather display with detailed forecasts and alerts
 */

import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    Brain,
    Clock,
    Cloud,
    CloudRain,
    Droplets,
    Eye,
    Gauge,
    Lightbulb,
    MapPin,
    RefreshCw,
    Shield,
    Sun,
    Sunrise,
    Sunset,
    Thermometer,
    TrendingUp,
    Waves,
    Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { AirQualityCard } from './components/air-quality-card';
import { ForecastChart } from './components/forecast-chart';
import { HistoricalComparison } from './components/historical-comparison';
import { HourlyForecast } from './components/hourly-forecast';
import { MoonPhases } from './components/moon-phases';
import { TideInformation } from './components/tide-information';
import { TripInsights } from './components/trip-insights';

type WeatherData = {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    pressure?: number;
    visibility?: number;
    uv_index?: number;
    sunrise?: number;
    sunset?: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
  };
  location?: {
    name: string;
    country: string;
  };
  forecast: Array<{
    date: string;
    time?: string;
    temp_max: number;
    temp_min: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
    wind_speed: number;
    humidity?: number;
  }>;
  hourly?: Array<{
    time: number;
    temp: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
    wind_speed: number;
    humidity?: number;
  }>;
  airQuality?: {
    aqi: number;
    level: string;
    description: string;
  };
  historicalComparison?: {
    yesterday: {
      temp: number;
      condition: string;
      diff: number;
    };
    lastWeek: {
      avgTemp: number;
      avgCondition: string;
      diff: number;
    };
  };
  alerts: Array<{
    type?: string;
    severity: string;
    message: string;
    title?: string;
    description?: string;
  }>;
};

type WeatherClientProps = {
  locale: string;
};

const getWeatherIcon = (main: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-12 w-12',
  };
  const sizeClass = sizeClasses[size];

  switch (main.toLowerCase()) {
    case 'clear':
      return <Sun className={cn(sizeClass, 'text-amber-500')} />;
    case 'clouds':
      return <Cloud className={cn(sizeClass, 'text-slate-400')} />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className={cn(sizeClass, 'text-blue-500')} />;
    case 'thunderstorm':
      return <CloudRain className={cn(sizeClass, 'text-purple-500')} />;
    default:
      return <Cloud className={cn(sizeClass, 'text-slate-400')} />;
  }
};

const getWeatherGradient = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear':
      return 'from-amber-400 via-amber-300 to-amber-200';
    case 'clouds':
      return 'from-slate-400 via-slate-300 to-slate-200';
    case 'rain':
    case 'drizzle':
      return 'from-blue-500 via-blue-400 to-blue-300';
    case 'thunderstorm':
      return 'from-purple-600 via-purple-500 to-purple-400';
    default:
      return 'from-slate-400 via-slate-300 to-slate-200';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'extreme':
      return 'bg-red-50 border-red-200 text-red-900';
    case 'medium':
      return 'bg-amber-50 border-amber-200 text-amber-900';
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-900';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hari Ini';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Besok';
  }

  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function WeatherClient({ locale: _locale }: WeatherClientProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Memuat lokasi...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Bandar Lampung if location denied
          setLocation({ lat: -5.45, lng: 105.27 });
          setLocationName('Bandar Lampung, Indonesia');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setLocation({ lat: -5.45, lng: 105.27 });
      setLocationName('Bandar Lampung, Indonesia');
    }
  }, []);

  const {
    data: weatherData,
    isLoading,
    error,
    refetch,
  } = useQuery<WeatherData>({
    queryKey: [...queryKeys.guide.all, 'weather', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return null;
      const res = await fetch(`/api/guide/weather?lat=${location.lat}&lng=${location.lng}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      
      // Update location name if available
      if (data.location) {
        setLocationName(`${data.location.name}, ${data.location.country}`);
      }
      
      return data;
    },
    enabled: !!location,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Auto-refresh every 10 minutes
  });

  // Fetch AI insights
  const {
    data: aiInsightsData,
    isLoading: aiInsightsLoading,
  } = useQuery<{
    insights: {
      safety_assessment: {
        level: 'safe' | 'caution' | 'risky' | 'unsafe';
        reasoning: string;
        warnings: string[];
      };
      trip_specific_insights?: Array<{
        tripId: string;
        tripCode: string;
        tripDate: string;
        riskLevel: 'low' | 'medium' | 'high';
        recommendations: Array<{
          type: 'go_ahead' | 'postpone' | 'modify' | 'cancel';
          title: string;
          description: string;
          priority: 'high' | 'medium' | 'low';
        }>;
        alternativePlans?: Array<{
          title: string;
          description: string;
          conditions: string;
        }>;
        bestDepartureTime?: string;
        bestReturnTime?: string;
        equipmentNeeds?: Array<{
          item: string;
          reason: string;
          priority: 'essential' | 'recommended' | 'optional';
        }>;
        weatherComparison?: {
          currentLocation: string;
          destination: string;
        };
        tideConsiderations?: string;
      }>;
      performance_impact?: {
        predictedRatingImpact: number;
        onTimeRisk: 'low' | 'medium' | 'high';
        cancellationRisk: number;
        revenueRisk: number;
        reasoning: string;
      };
      communication_strategy?: {
        notifyPassengers: boolean;
        notifyTime: string;
        messageTemplate: string;
      };
      trip_recommendations?: Array<{
        type: 'go_ahead' | 'postpone' | 'modify' | 'cancel';
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
      }>;
      equipment_suggestions: Array<{
        item: string;
        reason: string;
        priority: 'essential' | 'recommended' | 'optional';
      }>;
      sea_conditions: {
        wave_height: 'calm' | 'moderate' | 'rough' | 'very_rough';
        visibility: 'excellent' | 'good' | 'poor';
        advice: string;
      };
      best_times: {
        today: string;
        next_3_days: string;
      };
      clothing_recommendations: string[];
    };
  }>({
    queryKey: [...queryKeys.guide.all, 'weather', 'insights', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return null;
      const res = await fetch(`/api/guide/weather/insights?lat=${location.lat}&lng=${location.lng}`);
      if (!res.ok) throw new Error('Failed to fetch AI insights');
      const data = await res.json();
      return data;
    },
    enabled: !!location && !!weatherData,
    staleTime: 600000, // 10 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading || !location) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <LoadingState variant="skeleton" lines={3} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !weatherData) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'weather-client.tsx:377',message:'Weather data error or null',data:{hasError:!!error,hasWeatherData:!!weatherData,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat data cuaca'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  if (!weatherData?.current || !weatherData.current?.weather) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message="Data cuaca tidak lengkap"
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const weatherMain = weatherData.current.weather.main ?? 'clear';
  const gradientClass = getWeatherGradient(weatherMain);

  return (
    <div className="space-y-4 pb-6">
      {/* Current Weather - Enhanced Hero Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={cn('bg-gradient-to-br p-6 text-white', gradientClass)}>
          {/* Header with location and refresh */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">{locationName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>

          {/* Main Weather Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">{getWeatherIcon(weatherMain, 'lg')}</div>
              <div>
                <div className="text-5xl font-bold">{Math.round(weatherData.current?.temp || 0)}°</div>
                <div className="mt-1 text-lg capitalize text-white/90">
                  {weatherData.current?.weather?.description || 'N/A'}
                </div>
                <div className="mt-1 text-sm text-white/80">
                  Terasa seperti {Math.round(weatherData.current?.feels_like || 0)}°
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-white/20 p-4 backdrop-blur-sm">
            <div className="text-center">
              <Wind className="mx-auto h-5 w-5 mb-1" />
              <div className="text-xs text-white/80">Angin</div>
              <div className="mt-0.5 text-sm font-semibold">{weatherData.current?.wind_speed || 0} km/h</div>
            </div>
            <div className="text-center">
              <Droplets className="mx-auto h-5 w-5 mb-1" />
              <div className="text-xs text-white/80">Kelembaban</div>
              <div className="mt-0.5 text-sm font-semibold">{weatherData.current?.humidity || 0}%</div>
            </div>
            {weatherData.current?.pressure && (
              <div className="text-center">
                <Gauge className="mx-auto h-5 w-5 mb-1" />
                <div className="text-xs text-white/80">Tekanan</div>
                <div className="mt-0.5 text-sm font-semibold">{weatherData.current.pressure} hPa</div>
              </div>
            )}
          </div>

          {/* Sunrise/Sunset */}
          {(weatherData.current?.sunrise || weatherData.current?.sunset) && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              {weatherData.current?.sunrise && (
                <div className="flex items-center gap-2">
                  <Sunrise className="h-4 w-4" />
                  <span>{formatTime(weatherData.current.sunrise)}</span>
                </div>
              )}
              {weatherData.current?.sunset && (
                <div className="flex items-center gap-2">
                  <Sunset className="h-4 w-4" />
                  <span>{formatTime(weatherData.current.sunset)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Hourly Forecast */}
      {weatherData?.hourly && Array.isArray(weatherData.hourly) && weatherData.hourly.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Prakiraan Per Jam (24 Jam)</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Perkiraan suhu dan kondisi cuaca untuk 24 jam ke depan
            </p>
          </CardHeader>
          <CardContent>
            <HourlyForecast hourly={weatherData.hourly} />
          </CardContent>
        </Card>
      )}

      {/* Trip-Specific Insights */}
      {aiInsightsData?.insights?.trip_specific_insights && 
       aiInsightsData.insights.trip_specific_insights.length > 0 && (
        <TripInsights insights={aiInsightsData.insights.trip_specific_insights} />
      )}

      {/* Performance Impact */}
      {aiInsightsData?.insights?.performance_impact && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Prediksi Dampak Performa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 border border-purple-200">
                <div className="text-xs text-purple-700 mb-1">Dampak Rating</div>
                <div className="text-2xl font-bold text-purple-900">
                  {typeof aiInsightsData.insights.performance_impact.predictedRatingImpact === 'number' 
                    ? `${aiInsightsData.insights.performance_impact.predictedRatingImpact > 0 ? '+' : ''}${aiInsightsData.insights.performance_impact.predictedRatingImpact.toFixed(1)}`
                    : 'N/A'}
                </div>
                <div className="text-xs text-purple-600 mt-1">dari skala 0-5</div>
              </div>
              <div className="rounded-xl bg-white p-4 border border-purple-200">
                <div className="text-xs text-purple-700 mb-1">Risiko Keterlambatan</div>
                <div className="text-2xl font-bold text-purple-900 capitalize">
                  {aiInsightsData.insights.performance_impact.onTimeRisk === 'low' ? 'Rendah' :
                   aiInsightsData.insights.performance_impact.onTimeRisk === 'medium' ? 'Sedang' :
                   aiInsightsData.insights.performance_impact.onTimeRisk === 'high' ? 'Tinggi' :
                   'N/A'}
                </div>
                <div className="text-xs text-purple-600 mt-1">Berdasarkan cuaca</div>
              </div>
              <div className="rounded-xl bg-white p-4 border border-purple-200">
                <div className="text-xs text-purple-700 mb-1">Risiko Pembatalan</div>
                <div className="text-2xl font-bold text-purple-900">
                  {typeof aiInsightsData.insights.performance_impact.cancellationRisk === 'number'
                    ? `${aiInsightsData.insights.performance_impact.cancellationRisk.toFixed(0)}%`
                    : 'N/A'}
                </div>
                <div className="text-xs text-purple-600 mt-1">Probabilitas</div>
              </div>
              <div className="rounded-xl bg-white p-4 border border-purple-200">
                <div className="text-xs text-purple-700 mb-1">Risiko Pendapatan</div>
                <div className="text-2xl font-bold text-purple-900">
                  {typeof aiInsightsData.insights.performance_impact.revenueRisk === 'number'
                    ? `${aiInsightsData.insights.performance_impact.revenueRisk.toFixed(0)}%`
                    : 'N/A'}
                </div>
                <div className="text-xs text-purple-600 mt-1">Dampak finansial</div>
              </div>
            </div>
            {aiInsightsData.insights.performance_impact.reasoning && (
              <div className="mt-4 rounded-lg bg-purple-50 p-3">
                <p className="text-xs text-purple-700 leading-relaxed">
                  {aiInsightsData.insights.performance_impact.reasoning}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communication Strategy */}
      {aiInsightsData?.insights?.communication_strategy && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              Strategi Komunikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={aiInsightsData.insights.communication_strategy.notifyPassengers ? 'default' : 'secondary'}>
                  {aiInsightsData.insights.communication_strategy.notifyPassengers ? 'Perlu Notifikasi' : 'Tidak Perlu Notifikasi'}
                </Badge>
                {aiInsightsData.insights.communication_strategy.notifyTime && (
                  <span className="text-sm text-slate-600">
                    Waktu: {aiInsightsData.insights.communication_strategy.notifyTime}
                  </span>
                )}
              </div>
              {aiInsightsData.insights.communication_strategy.messageTemplate && (
                <div className="rounded-lg bg-white p-3 border border-blue-200">
                  <div className="text-xs font-medium text-blue-900 mb-2">Template Pesan</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {aiInsightsData.insights.communication_strategy.messageTemplate}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Weather Insights */}
      {aiInsightsData?.insights && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-emerald-600" />
                Insight AI Cuaca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Safety Assessment */}
            {aiInsightsData.insights?.safety_assessment && (
              <div className="rounded-xl border border-emerald-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Shield className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    aiInsightsData.insights.safety_assessment.level === 'safe' && 'text-emerald-600',
                    aiInsightsData.insights.safety_assessment.level === 'caution' && 'text-amber-600',
                    aiInsightsData.insights.safety_assessment.level === 'risky' && 'text-orange-600',
                    aiInsightsData.insights.safety_assessment.level === 'unsafe' && 'text-red-600',
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">Tingkat Keamanan</span>
                      <Badge
                        variant={
                          aiInsightsData.insights.safety_assessment.level === 'safe' ? 'default' :
                          aiInsightsData.insights.safety_assessment.level === 'caution' ? 'secondary' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {aiInsightsData.insights.safety_assessment.level === 'safe' ? 'Aman' :
                          aiInsightsData.insights.safety_assessment.level === 'caution' ? 'Hati-hati' :
                          aiInsightsData.insights.safety_assessment.level === 'risky' ? 'Berisiko' :
                          'Tidak Aman'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {aiInsightsData.insights.safety_assessment.reasoning || 'Tidak ada penjelasan'}
                    </p>
                    {Array.isArray(aiInsightsData.insights.safety_assessment.warnings) && aiInsightsData.insights.safety_assessment.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {aiInsightsData.insights.safety_assessment.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trip Recommendations */}
            {Array.isArray(aiInsightsData.insights.trip_recommendations) && aiInsightsData.insights.trip_recommendations.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Rekomendasi Trip</span>
                </div>
                <div className="space-y-2">
                  {aiInsightsData.insights.trip_recommendations.map((rec, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm text-slate-900">{rec.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {rec.priority === 'high' ? 'Tinggi' : rec.priority === 'medium' ? 'Sedang' : 'Rendah'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sea Conditions */}
            {aiInsightsData.insights.sea_conditions && (
              <div className="rounded-xl border border-cyan-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Waves className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold text-slate-900">Kondisi Laut</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-cyan-50 p-3">
                    <div className="text-xs text-cyan-700 mb-1">Tinggi Gelombang</div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {aiInsightsData.insights.sea_conditions.wave_height === 'calm' ? 'Tenang' :
                        aiInsightsData.insights.sea_conditions.wave_height === 'moderate' ? 'Sedang' :
                        aiInsightsData.insights.sea_conditions.wave_height === 'rough' ? 'Kasar' :
                        'Sangat Kasar'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-cyan-50 p-3">
                    <div className="text-xs text-cyan-700 mb-1">Jarak Pandang</div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {aiInsightsData.insights.sea_conditions.visibility === 'excellent' ? 'Sangat Baik' :
                        aiInsightsData.insights.sea_conditions.visibility === 'good' ? 'Baik' :
                        'Buruk'}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {aiInsightsData.insights.sea_conditions.advice}
                </p>
              </div>
            )}

            {/* Equipment Suggestions */}
            {Array.isArray(aiInsightsData.insights.equipment_suggestions) && aiInsightsData.insights.equipment_suggestions.length > 0 && (
              <div className="rounded-xl border border-purple-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-slate-900">Saran Perlengkapan</span>
                </div>
                <div className="space-y-2">
                  {aiInsightsData.insights.equipment_suggestions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full mt-1.5 flex-shrink-0',
                        item.priority === 'essential' && 'bg-red-500',
                        item.priority === 'recommended' && 'bg-amber-500',
                        item.priority === 'optional' && 'bg-slate-400',
                      )} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{item.item}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.priority === 'essential' ? 'Wajib' :
                              item.priority === 'recommended' ? 'Disarankan' :
                              'Opsional'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Times */}
            {aiInsightsData.insights.best_times && (
              <div className="rounded-xl border border-emerald-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Waktu Terbaik</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Hari Ini</div>
                    <p className="text-sm text-slate-900">{aiInsightsData.insights.best_times.today}</p>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-1">3 Hari ke Depan</div>
                    <p className="text-sm text-slate-900">{aiInsightsData.insights.best_times.next_3_days}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Clothing Recommendations */}
            {Array.isArray(aiInsightsData.insights.clothing_recommendations) && aiInsightsData.insights.clothing_recommendations.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-slate-900">Rekomendasi Pakaian</span>
                </div>
                <ul className="space-y-1.5">
                  {aiInsightsData.insights.clothing_recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights Loading */}
      {aiInsightsLoading && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-emerald-600" />
              Insight AI Cuaca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState variant="skeleton" lines={4} />
          </CardContent>
        </Card>
      )}

      {/* Weather Alerts - Enhanced */}
      {weatherData?.alerts && Array.isArray(weatherData.alerts) && weatherData.alerts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Peringatan Cuaca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weatherData.alerts.map((alert, i) => {
              if (!alert) return null;
              const severityColor = getSeverityColor(alert.severity || 'medium');
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    severityColor
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      {alert.title && (
                        <div className="font-semibold mb-1">{alert.title}</div>
                      )}
                      <div className="text-sm leading-relaxed">
                        {alert.message || alert.description || 'Tidak ada pesan'}
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {alert.severity || 'Info'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Air Quality */}
      {weatherData?.airQuality && weatherData.airQuality.aqi && (
        <AirQualityCard airQuality={weatherData.airQuality} />
      )}

      {/* Moon Phases */}
      {location && (
        <MoonPhases lat={location.lat} lng={location.lng} />
      )}

      {/* Tide Information */}
      {location && location.lat && location.lng && (
        <TideInformation lat={location.lat} lng={location.lng} />
      )}

      {/* Detailed Metrics */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detail Cuaca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Thermometer className="h-4 w-4" />
                <span className="text-xs font-medium">Suhu Terasa</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(weatherData.current?.feels_like || 0)}°
              </div>
            </div>
            {weatherData.current?.visibility && (
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-medium">Jarak Pandang</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {((weatherData.current.visibility || 0) / 1000).toFixed(1)} km
                </div>
              </div>
            )}
            {weatherData.current?.uv_index !== undefined && weatherData.current.uv_index !== null && (
              <>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Sun className="h-4 w-4" />
                    <span className="text-xs font-medium">UV Index</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {weatherData.current.uv_index}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {weatherData.current.uv_index <= 2
                      ? 'Rendah'
                      : weatherData.current.uv_index <= 5
                        ? 'Sedang'
                        : weatherData.current.uv_index <= 7
                          ? 'Tinggi'
                          : 'Sangat Tinggi'}
                  </div>
                </div>
              </>
            )}
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Droplets className="h-4 w-4" />
                <span className="text-xs font-medium">Kelembaban</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {weatherData.current?.humidity || 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast - Historical Chart */}
      {weatherData.forecast && weatherData.forecast.length > 0 && (
        <>
          {/* #region agent log */}
          {(() => {
            fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'weather-client.tsx:907',message:'Before rendering ForecastChart',data:{forecastLength:weatherData.forecast.length,firstItem:JSON.stringify(weatherData.forecast[0]).substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            return null;
          })()}
          {/* #endregion */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Prakiraan Cuaca 7 Hari</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Trend suhu dan kondisi cuaca untuk 7 hari ke depan
              </p>
            </CardHeader>
            <CardContent>
              <ForecastChart forecast={weatherData.forecast.slice(0, 7)} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Historical Comparison */}
      {weatherData.historicalComparison && weatherData.current && (
        <HistoricalComparison
          currentTemp={weatherData.current?.temp || 0}
          currentCondition={weatherData.current?.weather?.main || 'Unknown'}
          historicalComparison={weatherData.historicalComparison}
        />
      )}

      {/* Empty State for Forecast */}
      {(!weatherData.forecast || weatherData.forecast.length === 0) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <EmptyState
              icon={Cloud}
              title="Tidak ada prakiraan cuaca"
              description="Data prakiraan cuaca tidak tersedia saat ini"
              variant="default"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
