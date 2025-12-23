'use client';

/**
 * Sustainability Metrics Component
 * Displays sustainability and waste-related metrics
 */

import { Leaf, Recycle, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type SustainabilityMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function SustainabilityMetrics({
  metrics,
  className,
}: SustainabilityMetricsProps) {
  const sustainability = metrics.sustainability;

  if (!sustainability) {
    return null;
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (!score) return 'bg-slate-500';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Sustainability & Waste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Sustainability Score */}
        {sustainability.sustainabilityScore !== null && (
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">
                Sustainability Score
              </span>
            </div>
            <Badge
              className={cn(
                'px-4 py-2 text-2xl font-bold',
                getScoreBadgeColor(sustainability.sustainabilityScore)
              )}
            >
              {sustainability.sustainabilityScore}/100
            </Badge>
          </div>
        )}

        {/* Total Waste */}
        <div className="rounded-lg bg-slate-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                Total Waste
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {sustainability.totalWasteKg.toFixed(1)} kg
            </span>
          </div>

          {/* Waste by Type */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded bg-blue-50/50 p-2">
              <p className="text-xs text-blue-700/80">Plastic</p>
              <p className="text-sm font-bold text-blue-900">
                {sustainability.wasteByType.plastic.toFixed(1)} kg
              </p>
            </div>
            <div className="rounded bg-amber-50/50 p-2">
              <p className="text-xs text-amber-700/80">Organic</p>
              <p className="text-sm font-bold text-amber-900">
                {sustainability.wasteByType.organic.toFixed(1)} kg
              </p>
            </div>
            <div className="rounded bg-purple-50/50 p-2">
              <p className="text-xs text-purple-700/80">Glass</p>
              <p className="text-sm font-bold text-purple-900">
                {sustainability.wasteByType.glass.toFixed(1)} kg
              </p>
            </div>
            <div className="rounded bg-red-50/50 p-2">
              <p className="text-xs text-red-700/80">Hazmat</p>
              <p className="text-sm font-bold text-red-900">
                {sustainability.wasteByType.hazmat.toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        {/* Recycling Rate */}
        {sustainability.recyclingRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">
                  Recycling Rate
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getScoreColor(sustainability.recyclingRate)
                )}
              >
                {sustainability.recyclingRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={sustainability.recyclingRate} className="h-2" />
          </div>
        )}

        {/* Carbon Footprint */}
        <div className="rounded-lg bg-indigo-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">
                Carbon Footprint
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {sustainability.carbonFootprintKg.toFixed(1)} kg CO₂
            </span>
          </div>
          {sustainability.carbonPerGuest !== null && (
            <p className="mt-1 text-xs text-slate-600">
              {sustainability.carbonPerGuest.toFixed(2)} kg CO₂ per guest
            </p>
          )}
        </div>

        {/* Waste Reduction Trend */}
        {sustainability.wasteReductionTrend !== null && (
          <div className="rounded-lg bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sustainability.wasteReductionTrend > 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  Waste Reduction
                </span>
              </div>
              <span
                className={cn(
                  'text-lg font-bold',
                  sustainability.wasteReductionTrend > 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                )}
              >
                {sustainability.wasteReductionTrend > 0 ? '+' : ''}
                {sustainability.wasteReductionTrend.toFixed(1)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">vs previous period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
