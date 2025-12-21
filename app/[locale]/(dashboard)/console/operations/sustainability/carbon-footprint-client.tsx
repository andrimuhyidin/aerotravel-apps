'use client';

/**
 * Carbon Footprint Dashboard Client Component
 * Admin dashboard untuk melihat carbon footprint report dengan charts
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';

type CarbonFootprintClientProps = {
  locale: string;
};

type CarbonFootprintData = {
  period: {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_fuel_liters: number;
    total_co2_kg: number;
    total_distance_nm: number;
    trip_count: number;
    co2_trend_percent: number;
  };
  goal: {
    target_co2_kg: number;
    actual_co2_kg: number;
    progress_percent: number | null;
    status: 'on_target' | 'exceeded';
  } | null;
  trip_breakdown: Array<{
    trip_id: string;
    trip_code: string | null;
    trip_name: string | null;
    fuel_liters: number;
    fuel_type: string;
    distance_nm: number;
    co2_emissions_kg: number;
    logged_at: string;
  }>;
};

export function CarbonFootprintClient({ locale }: CarbonFootprintClientProps) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading, error } = useQuery<CarbonFootprintData>({
    queryKey: ['carbon-footprint', month, year],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/reports/carbon-footprint?month=${month}&year=${year}`
      );
      if (!res.ok) throw new Error('Failed to fetch carbon footprint data');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading carbon footprint data...</div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load carbon footprint data', error);
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load data</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, goal, trip_breakdown } = data;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carbon Footprint Report</h1>
          <p className="text-slate-600">Monthly carbon emissions tracking (ISO 14001)</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value, 10))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value, 10))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total CO2 Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.total_co2_kg.toFixed(2)} kg
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              {summary.co2_trend_percent > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">+{summary.co2_trend_percent.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{summary.co2_trend_percent.toFixed(1)}%</span>
                </>
              )}
              <span>vs previous month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Fuel Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.total_fuel_liters.toFixed(2)} L
            </div>
            <div className="mt-1 text-xs text-slate-500">{summary.trip_count} trips</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.total_distance_nm.toFixed(2)} NM
            </div>
            <div className="mt-1 text-xs text-slate-500">Total nautical miles</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Goal Status</CardTitle>
          </CardHeader>
          <CardContent>
            {goal ? (
              <>
                <div
                  className={`text-2xl font-bold ${
                    goal.status === 'on_target' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {goal.status === 'on_target' ? 'On Target' : 'Exceeded'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {goal.progress_percent !== null
                    ? `${goal.progress_percent.toFixed(1)}% of target`
                    : 'No target set'}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">No Goal</div>
                <div className="mt-1 text-xs text-slate-500">Set sustainability goal</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      {goal && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
            <CardDescription>
              Target: {goal.target_co2_kg.toFixed(2)} kg CO2 | Actual: {goal.actual_co2_kg.toFixed(2)} kg CO2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium">
                  {goal.progress_percent !== null ? `${goal.progress_percent.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all ${
                    goal.status === 'on_target' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${
                      goal.progress_percent !== null
                        ? Math.min(100, Math.max(0, goal.progress_percent))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Breakdown</CardTitle>
          <CardDescription>CO2 emissions per trip</CardDescription>
        </CardHeader>
        <CardContent>
          {trip_breakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No fuel logs for this period</div>
          ) : (
            <div className="space-y-3">
              {trip_breakdown.map((trip) => (
                <div
                  key={trip.trip_id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {trip.trip_name || trip.trip_code || trip.trip_id}
                    </div>
                    <div className="text-sm text-slate-600">
                      {trip.fuel_liters.toFixed(2)} L {trip.fuel_type} • {trip.distance_nm.toFixed(2)} NM
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(trip.logged_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {trip.co2_emissions_kg.toFixed(2)} kg CO2
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

