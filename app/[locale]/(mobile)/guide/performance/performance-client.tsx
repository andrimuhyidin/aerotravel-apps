'use client';

/**
 * Performance Client Component
 * Display performance metrics, trends, and AI insights
 */

import { useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    Brain,
    Calendar,
    DollarSign,
    Star,
    Users
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { PerformanceAiCoach } from './performance-ai-coach';

type PerformanceClientProps = {
  locale: string;
};

type PerformanceMetrics = {
  id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  average_rating: number | null;
  total_ratings: number;
  on_time_rate: number | null;
  customer_satisfaction_score: number | null;
  skills_improved: number;
  assessments_completed: number;
  total_earnings: number;
  average_per_trip: number;
  overall_score: number | null;
  performance_tier: string | null;
};

export function PerformanceClient({ locale: _locale }: PerformanceClientProps) {
  // Fetch current period metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery<{
    metrics: PerformanceMetrics;
  }>({
    queryKey: queryKeys.guide.performance.metrics({ period: 'monthly' }),
    queryFn: async () => {
      const res = await fetch('/api/guide/performance/metrics?period=monthly');
      if (!res.ok) throw new Error('Failed to load metrics');
      return (await res.json()) as { metrics: PerformanceMetrics };
    },
  });

  // Fetch AI insights
  const { data: insightsData, error: insightsError, refetch: refetchInsights } = useQuery<{
    insights: {
      summary?: string;
      trends?: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; change: number }>;
      recommendations?: string[];
    };
  }>({
    queryKey: queryKeys.guide.performance.insights(),
    queryFn: async () => {
      const res = await fetch('/api/guide/performance/insights');
      if (!res.ok) throw new Error('Failed to load insights');
      return (await res.json()) as { insights: {
        summary?: string;
        trends?: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; change: number }>;
        recommendations?: string[];
      } };
    },
  });

  const metrics = metricsData?.metrics;
  const insights = insightsData?.insights;

  if (metricsError || insightsError) {
    const error = metricsError || insightsError;
    const refetch = () => {
      void refetchMetrics();
      void refetchInsights();
    };
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Gagal memuat data performa'}
        onRetry={refetch}
        variant="card"
      />
    );
  }

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'excellent':
        return 'bg-emerald-500 text-white';
      case 'good':
        return 'bg-blue-500 text-white';
      case 'average':
        return 'bg-amber-500 text-white';
      case 'needs_improvement':
        return 'bg-red-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getTierLabel = (tier: string | null) => {
    switch (tier) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'average':
        return 'Average';
      case 'needs_improvement':
        return 'Perlu Peningkatan';
      default:
        return 'N/A';
    }
  };

  if (metricsLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <LoadingState variant="skeleton" lines={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12">
          <EmptyState
            icon={BarChart3}
            title="Belum ada data performa"
            description="Data performa akan muncul setelah Anda menyelesaikan beberapa trip"
            variant="default"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Overall Score Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <Badge className={cn('text-sm font-semibold px-4 py-1', getTierColor(metrics.performance_tier))}>
              {getTierLabel(metrics.performance_tier)}
            </Badge>
          </div>
          {metrics.overall_score !== null && (
            <div className="mb-2">
              <span className="text-5xl font-bold text-slate-900">{Math.round(metrics.overall_score)}</span>
              <span className="text-2xl text-slate-600">/100</span>
            </div>
          )}
          <p className="text-sm text-slate-600">
            Periode:{' '}
            {metrics.period_start
              ? (() => {
                  try {
                    return new Date(metrics.period_start).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    });
                  } catch {
                    return 'Tanggal tidak valid';
                  }
                })()
              : 'Periode tidak tersedia'}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total Trips</p>
                <p className="text-xl font-bold text-slate-900">{metrics.total_trips}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {metrics.completed_trips} selesai
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Rating Rata-rata</p>
                <p className="text-xl font-bold text-slate-900">
                  {metrics.average_rating ? metrics.average_rating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {metrics.total_ratings} ulasan
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total Earnings</p>
                <p className="text-xl font-bold text-slate-900">
                  Rp {metrics.total_earnings.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Rata-rata: Rp {metrics.average_per_trip.toLocaleString('id-ID')}/trip
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">On-Time Rate</p>
                <p className="text-xl font-bold text-slate-900">
                  {metrics.on_time_rate ? `${metrics.on_time_rate.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Ketepatan waktu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Development Metrics */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Development Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-600 mb-1">Skills Improved</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.skills_improved}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-600 mb-1">Assessments Completed</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.assessments_completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-600" />
              AI Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.summary && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Ringkasan</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{insights.summary}</p>
              </div>
            )}
            {insights.recommendations && Array.isArray(insights.recommendations) && insights.recommendations.length > 0 && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Rekomendasi</h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Performance Coach */}
      <PerformanceAiCoach locale={_locale} />
    </div>
  );
}
