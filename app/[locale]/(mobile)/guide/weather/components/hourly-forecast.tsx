'use client';

/**
 * Hourly Forecast Component
 * Horizontal scrollable bar chart untuk 24 jam ke depan
 */

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Cloud, CloudRain, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

type HourlyItem = {
  time: number;
  temp: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  wind_speed: number;
  humidity?: number;
};

type HourlyForecastProps = {
  hourly: HourlyItem[];
};

const getWeatherIcon = (main: string) => {
  switch (main.toLowerCase()) {
    case 'clear':
      return <Sun className="h-3 w-3 text-amber-500" />;
    case 'clouds':
      return <Cloud className="h-3 w-3 text-slate-400" />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className="h-3 w-3 text-blue-500" />;
    default:
      return <Cloud className="h-3 w-3 text-slate-400" />;
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <div className="mb-2 font-semibold text-slate-900">{formatTime(data.time)}</div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Suhu:</span>
            <span className="font-semibold text-slate-900">{data.temp}°C</span>
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

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  if (!hourly || hourly.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = hourly.map((item) => ({
    time: item.time,
    temp: item.temp,
    humidity: item.humidity || 0,
    windSpeed: item.wind_speed,
    weather: item.weather,
  }));

  // Calculate min and max for Y-axis
  const allTemps = chartData.map((d) => d.temp);
  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);
  const yAxisMin = Math.floor(minTemp - 2);
  const yAxisMax = Math.ceil(maxTemp + 2);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}°`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="temp"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Suhu"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

