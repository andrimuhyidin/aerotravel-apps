/**
 * Risk Trend Chart Component
 * Display historical risk assessment trends
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';

type RiskTrendChartProps = {
  tripId?: string;
  days?: number;
};

export function RiskTrendChart({ tripId, days: initialDays = 30 }: RiskTrendChartProps) {
  const [days, setDays] = useState(initialDays);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const { data, isLoading, error } = useQuery<{
    trendData: Array<{
      date: string;
      count: number;
      avgRiskScore: number;
      minRiskScore: number;
      maxRiskScore: number;
      safeCount: number;
      unsafeCount: number;
      safePercentage: number;
    }>;
    statistics: {
      total: number;
      avgRiskScore: number;
      safeCount: number;
      unsafeCount: number;
      safePercentage: number;
    };
  }>({
    queryKey: queryKeys.guide.trips.riskTrend({ tripId, days, groupBy }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tripId) params.append('tripId', tripId);
      params.append('days', days.toString());
      params.append('groupBy', groupBy);

      const res = await fetch(`/api/guide/risk/trend?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch risk trend data');
      return res.json();
    },
  });

  const chartData = useMemo(() => {
    if (!data?.trendData) return [];

    return data.trendData.map((item) => ({
      date: formatDate(item.date, groupBy),
      avgRiskScore: Math.round(item.avgRiskScore * 100) / 100,
      minRiskScore: item.minRiskScore,
      maxRiskScore: item.maxRiskScore,
      safeCount: item.safeCount,
      unsafeCount: item.unsafeCount,
      safePercentage: Math.round(item.safePercentage * 100) / 100,
    }));
  }, [data, groupBy]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorState message="Gagal memuat data trend risiko" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.trendData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Tidak ada data"
            description="Belum ada data risk assessment untuk periode ini"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Risk Trend Analysis</CardTitle>
          <div className="flex gap-2">
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Harian</SelectItem>
                <SelectItem value="week">Mingguan</SelectItem>
                <SelectItem value="month">Bulanan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari</SelectItem>
                <SelectItem value="30">30 hari</SelectItem>
                <SelectItem value="90">90 hari</SelectItem>
                <SelectItem value="180">180 hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">Total Assessments</p>
            <p className="text-lg font-semibold">{data.statistics.total}</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600">Safe Trips</p>
            <p className="text-lg font-semibold text-emerald-700">{data.statistics.safeCount}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">Unsafe Trips</p>
            <p className="text-lg font-semibold text-red-700">{data.statistics.unsafeCount}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Avg Risk Score</p>
            <p className="text-lg font-semibold text-blue-700">{data.statistics.avgRiskScore}</p>
          </div>
        </div>

        {/* Risk Score Trend Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-2">Average Risk Score Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? [value.toFixed(2), 'Risk Score'] : ['', '']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="avgRiskScore"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {/* Threshold line at 70 */}
              <Line
                type="monotone"
                dataKey={() => 70}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2">
            Garis merah menunjukkan threshold risiko (70). Score di atas 70 = trip tidak aman.
          </p>
        </div>

        {/* Safe vs Unsafe Comparison */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Safe vs Unsafe Trips</h4>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="safeCount"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="unsafeCount"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {data.statistics.avgRiskScore > 70 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Perhatian</p>
                <p className="text-xs text-amber-700 mt-1">
                  Rata-rata risk score ({data.statistics.avgRiskScore}) melebihi threshold aman (70).
                  Pertimbangkan untuk meningkatkan prosedur keselamatan.
                </p>
              </div>
            </div>
          </div>
        )}

        {data.statistics.safePercentage >= 90 && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Prestasi Baik</p>
                <p className="text-xs text-emerald-700 mt-1">
                  {data.statistics.safePercentage}% trip dinyatakan aman. Pertahankan standar keselamatan ini!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string, groupBy: 'day' | 'week' | 'month'): string {
  const date = new Date(dateString);
  
  if (groupBy === 'day') {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } else if (groupBy === 'week') {
    return `Week ${date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  }
}

