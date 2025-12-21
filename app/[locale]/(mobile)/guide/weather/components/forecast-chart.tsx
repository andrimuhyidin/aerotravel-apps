'use client';

/**
 * Forecast Chart Component
 * Historical temperature chart dengan area chart untuk trend suhu 7 hari
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Cloud, CloudRain, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

type ForecastItem = {
  date: string;
  temp_max: number;
  temp_min: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  wind_speed: number;
  humidity?: number;
};

type ForecastChartProps = {
  forecast: ForecastItem[];
};

const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'clouds':
      return <Cloud className="h-4 w-4 text-slate-400" />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    default:
      return <Cloud className="h-4 w-4 text-slate-400" />;
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <div className="mb-2 font-semibold text-slate-900">{formatDate(data.date)}</div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Suhu Maks:</span>
            <span className="font-semibold text-red-600">{data.temp_max}°C</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Suhu Min:</span>
            <span className="font-semibold text-blue-600">{data.temp_min}°C</span>
          </div>
          {data.humidity && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600">Kelembaban:</span>
              <span className="font-semibold text-slate-900">{data.humidity}%</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Angin:</span>
            <span className="font-semibold text-slate-900">{Math.round(data.wind_speed)} km/h</span>
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-slate-200 pt-2">
            {getWeatherIcon(data.weather.main)}
            <span className="text-xs capitalize text-slate-600">{data.weather.description}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ForecastChart({ forecast }: ForecastChartProps) {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = forecast.map((item) => ({
    date: item.date,
    tempMax: item.temp_max,
    tempMin: item.temp_min,
    humidity: item.humidity || 0,
    windSpeed: item.wind_speed,
    weather: item.weather,
  }));

  // Calculate min and max for Y-axis
  const allTemps = [...chartData.map((d) => d.tempMax), ...chartData.map((d) => d.tempMin)];
  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);
  const yAxisMin = Math.floor(minTemp - 2);
  const yAxisMax = Math.ceil(maxTemp + 2);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTempMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTempMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}°`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="tempMax"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorTempMax)"
            name="Suhu Maks"
          />
          <Area
            type="monotone"
            dataKey="tempMin"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorTempMin)"
            name="Suhu Min"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">Suhu Maks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs text-slate-600">Suhu Min</span>
        </div>
      </div>
    </div>
  );
}

