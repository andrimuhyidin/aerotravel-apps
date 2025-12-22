'use client';

/**
 * Historical Comparison Component
 * Widget untuk membandingkan cuaca hari ini vs kemarin dan minggu ini vs minggu lalu
 */

import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HistoricalComparisonProps = {
  currentTemp: number;
  currentCondition: string;
  historicalComparison: {
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
};

const getConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    Clear: 'Cerah',
    Clouds: 'Berawan',
    Rain: 'Hujan',
    Drizzle: 'Gerimis',
    Thunderstorm: 'Badai',
    Snow: 'Salju',
    Mist: 'Kabut',
  };
  return labels[condition] || condition;
};

export function HistoricalComparison({
  currentTemp,
  currentCondition,
  historicalComparison,
}: HistoricalComparisonProps) {
  if (!historicalComparison || !historicalComparison.yesterday || !historicalComparison.lastWeek) {
    return null;
  }

  const { yesterday, lastWeek } = historicalComparison;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Perbandingan Historis</CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Bandingkan cuaca hari ini dengan kemarin dan minggu lalu
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Yesterday Comparison */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-600">Kemarin</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {yesterday.temp ?? 0}°C
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {getConditionLabel(yesterday.condition ?? 'N/A')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-600">Hari Ini</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {currentTemp ?? 0}°C
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {getConditionLabel(currentCondition ?? 'N/A')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
            {yesterday.diff !== undefined && yesterday.diff > 0 ? (
              <>
                <ArrowUp className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-red-600">
                  {Math.abs(yesterday.diff).toFixed(1)}°C lebih panas
                </span>
              </>
            ) : yesterday.diff !== undefined && yesterday.diff < 0 ? (
              <>
                <ArrowDown className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">
                  {Math.abs(yesterday.diff).toFixed(1)}°C lebih dingin
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">
                  Sama dengan kemarin
                </span>
              </>
            )}
          </div>
        </div>

        {/* Last Week Comparison */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-600">Minggu Lalu (Rata-rata)</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {lastWeek.avgTemp ?? 0}°C
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {getConditionLabel(lastWeek.avgCondition ?? 'N/A')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-600">Hari Ini</div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {currentTemp ?? 0}°C
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {getConditionLabel(currentCondition ?? 'N/A')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
            {lastWeek.diff !== undefined && lastWeek.diff > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-red-600">
                  {Math.abs(lastWeek.diff).toFixed(1)}°C lebih panas dari rata-rata
                </span>
              </>
            ) : lastWeek.diff !== undefined && lastWeek.diff < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">
                  {Math.abs(lastWeek.diff).toFixed(1)}°C lebih dingin dari rata-rata
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">
                  Sama dengan rata-rata minggu lalu
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

