'use client';

/**
 * Unified Metrics Card Component
 * Reusable component for displaying guide performance metrics
 * Used in both insights and performance pages
 */

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  Minus,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type MetricsCardProps = {
  metrics: UnifiedMetrics;
  view?: 'compact' | 'detailed' | 'chart';
  showTrends?: boolean;
  className?: string;
};

export function MetricsCard({
  metrics,
  view = 'detailed',
  showTrends = true,
  className,
}: MetricsCardProps) {
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

  if (view === 'compact') {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600">Total Trips</p>
              <p className="text-lg font-bold text-slate-900">
                {metrics.trips.total}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Rating</p>
              <p className="text-lg font-bold text-slate-900">
                {metrics.ratings.average
                  ? metrics.ratings.average.toFixed(1)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Earnings</p>
              <p className="text-lg font-bold text-slate-900">
                Rp {Math.round(metrics.earnings.total / 1000)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Score</p>
              <p className="text-lg font-bold text-slate-900">
                {metrics.performance.score
                  ? Math.round(metrics.performance.score)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border-0 bg-gradient-to-br from-emerald-50 to-blue-50 shadow-sm',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Performance Metrics
          </CardTitle>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Periode:{' '}
          {metrics.period.start
            ? (() => {
                try {
                  return new Date(metrics.period.start).toLocaleDateString(
                    'id-ID',
                    {
                      month: 'long',
                      year: 'numeric',
                    }
                  );
                } catch {
                  return 'Tanggal tidak valid';
                }
              })()
            : 'Periode tidak tersedia'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Overall Score */}
        {metrics.performance.score !== null && (
          <div className="mb-4 rounded-xl bg-white/80 p-4 text-center backdrop-blur-sm">
            <p className="mb-1 text-xs text-slate-600">Overall Score</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-slate-900">
                {metrics.performance.score !== null
                  ? Math.round(metrics.performance.score)
                  : 'N/A'}
              </span>
              <span className="text-xl text-slate-600">/100</span>
            </div>
            {metrics.performance.tier && (
              <Badge
                className={cn('mt-2', getTierColor(metrics.performance.tier))}
              >
                {getTierLabel(metrics.performance.tier)}
              </Badge>
            )}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Trips */}
          <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700/80">
                Total Trips
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {metrics.trips.total}
            </p>
            <p className="mt-1 text-xs text-blue-700/70">
              {metrics.trips.completed} selesai
              {showTrends && metrics.trips.trend && (
                <span className="ml-2 flex items-center gap-0.5">
                  {metrics.trips.trend.direction === 'up' ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : metrics.trips.trend.direction === 'down' ? (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  ) : (
                    <Minus className="h-3 w-3 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      'text-xs',
                      metrics.trips.trend.direction === 'up' &&
                        'text-green-600',
                      metrics.trips.trend.direction === 'down' &&
                        'text-red-600',
                      metrics.trips.trend.direction === 'stable' &&
                        'text-slate-400'
                    )}
                  >
                    {metrics.trips.trend.value.toFixed(0)}%
                  </span>
                </span>
              )}
            </p>
          </div>

          {/* Average Rating */}
          <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-medium text-amber-700/80">
                Rating Rata-rata
              </p>
            </div>
            <p className="text-2xl font-bold text-amber-900">
              {metrics.ratings.average
                ? metrics.ratings.average.toFixed(1)
                : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-amber-700/70">
              {metrics.ratings.total} ulasan
            </p>
          </div>

          {/* Total Earnings */}
          <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-700/80">
                Total Earnings
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              Rp {(metrics.earnings.total || 0).toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-emerald-700/70">
              Rata-rata: Rp{' '}
              {(metrics.earnings.average || 0).toLocaleString('id-ID')}/trip
              {showTrends && metrics.earnings.trend && (
                <span className="ml-2 flex items-center gap-0.5">
                  {metrics.earnings.trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : metrics.earnings.trend.direction === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : (
                    <Minus className="h-3 w-3 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      'text-xs',
                      metrics.earnings.trend.direction === 'up' &&
                        'text-green-600',
                      metrics.earnings.trend.direction === 'down' &&
                        'text-red-600',
                      metrics.earnings.trend.direction === 'stable' &&
                        'text-slate-400'
                    )}
                  >
                    {metrics.earnings.trend.value.toFixed(0)}%
                  </span>
                </span>
              )}
            </p>
          </div>

          {/* On-Time Rate */}
          {metrics.performance.onTimeRate !== null && (
            <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-700/80">
                  On-Time Rate
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {metrics.performance.onTimeRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-purple-700/70">
                Percentile: {metrics.performance.percentile}%
              </p>
            </div>
          )}
        </div>

        {/* Development Metrics */}
        {(metrics.development.skillsImproved > 0 ||
          metrics.development.assessmentsCompleted > 0) && (
          <div className="mt-4 rounded-xl bg-white/80 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-semibold text-slate-700">
                Development Progress
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs text-slate-600">Skills Improved</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics.development.skillsImproved}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-600">
                  Assessments Completed
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics.development.assessmentsCompleted}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
