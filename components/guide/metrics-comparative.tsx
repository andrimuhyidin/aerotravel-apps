'use client';

/**
 * Comparative Metrics Component
 * Displays peer ranking and comparison metrics
 */

import { Award, BarChart3, Percent, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type ComparativeMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function ComparativeMetrics({
  metrics,
  className,
}: ComparativeMetricsProps) {
  const comparative = metrics.comparative;

  if (!comparative) {
    return null;
  }

  const getRankBadgeColor = (rank: number | null) => {
    if (!rank) return 'bg-slate-500';
    if (rank <= 3) return 'bg-emerald-500';
    if (rank <= 10) return 'bg-blue-500';
    if (rank <= 20) return 'bg-amber-500';
    return 'bg-slate-500';
  };

  const getRankLabel = (rank: number | null) => {
    if (!rank) return 'N/A';
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const formatGap = (gap: number | null) => {
    if (gap === null) return 'N/A';
    return `${gap.toFixed(1)}%`;
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Peer Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Peer Ranking */}
        {comparative.peerRanking !== null && (
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">
                Overall Ranking
              </span>
            </div>
            <Badge
              className={cn(
                'px-4 py-2 text-2xl font-bold',
                getRankBadgeColor(comparative.peerRanking)
              )}
            >
              {getRankLabel(comparative.peerRanking)}
            </Badge>
            <p className="mt-2 text-xs text-slate-600">
              Among peers in your branch
            </p>
          </div>
        )}

        {/* Percentile Improvement */}
        {comparative.percentileImprovement !== null && (
          <div className="rounded-lg bg-purple-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  Percentile Improvement
                </span>
              </div>
              <span
                className={cn(
                  'text-lg font-bold',
                  comparative.percentileImprovement > 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                )}
              >
                {comparative.percentileImprovement > 0 ? '+' : ''}
                {comparative.percentileImprovement.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Change from previous period
            </p>
          </div>
        )}

        {/* Top Performer Gap */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Gap with Top Performer
          </h3>
          <div className="space-y-2">
            {comparative.topPerformerGap.trips !== null && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50/50 p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Trips</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatGap(comparative.topPerformerGap.trips)}
                </span>
              </div>
            )}

            {comparative.topPerformerGap.earnings !== null && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50/50 p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Earnings</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatGap(comparative.topPerformerGap.earnings)}
                </span>
              </div>
            )}

            {comparative.topPerformerGap.ratings !== null && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50/50 p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Ratings</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatGap(comparative.topPerformerGap.ratings)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Market Share */}
        {comparative.marketShare !== null && (
          <div className="rounded-lg bg-indigo-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  Market Share
                </span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {comparative.marketShare.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Of total trips in your branch
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
