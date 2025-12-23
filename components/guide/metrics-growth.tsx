'use client';

/**
 * Growth Metrics Component
 * Displays growth trends and development progress
 */

import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  TrendingUp,
  Minus,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type GrowthMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function GrowthMetrics({ metrics, className }: GrowthMetricsProps) {
  const growth = metrics.growth;

  if (!growth) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="Belum ada data growth"
            description="Data growth akan muncul setelah Anda memiliki data dari beberapa periode."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
  }

  const hasData =
    growth.momGrowth.trips !== null ||
    growth.momGrowth.earnings !== null ||
    growth.momGrowth.ratings !== null ||
    growth.skillProgressionRate !== null ||
    growth.certificationCompletionRate !== null ||
    growth.assessmentImprovement !== null;

  if (!hasData) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="Belum ada data growth"
            description="Data growth akan muncul setelah Anda memiliki data dari beberapa periode."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
  }

  const formatGrowth = (value: number | null) => {
    if (value === null) return null;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number | null) => {
    if (value === null) return 'text-slate-400';
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getGrowthIcon = (value: number | null) => {
    if (value === null) return Minus;
    if (value > 0) return ArrowUp;
    if (value < 0) return ArrowDown;
    return Minus;
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Growth & Development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Month-over-Month Growth */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Month-over-Month Growth
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Trips Growth */}
            {growth.momGrowth.trips !== null && (
              <div className="rounded-lg bg-blue-50/50 p-3 text-center">
                <p className="mb-1 text-xs text-slate-600">Trips</p>
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const Icon = getGrowthIcon(growth.momGrowth.trips);
                    return (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          getGrowthColor(growth.momGrowth.trips)
                        )}
                      />
                    );
                  })()}
                  <span
                    className={cn(
                      'text-lg font-bold',
                      getGrowthColor(growth.momGrowth.trips)
                    )}
                  >
                    {formatGrowth(growth.momGrowth.trips)}
                  </span>
                </div>
              </div>
            )}

            {/* Earnings Growth */}
            {growth.momGrowth.earnings !== null && (
              <div className="rounded-lg bg-emerald-50/50 p-3 text-center">
                <p className="mb-1 text-xs text-slate-600">Earnings</p>
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const Icon = getGrowthIcon(growth.momGrowth.earnings);
                    return (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          getGrowthColor(growth.momGrowth.earnings)
                        )}
                      />
                    );
                  })()}
                  <span
                    className={cn(
                      'text-lg font-bold',
                      getGrowthColor(growth.momGrowth.earnings)
                    )}
                  >
                    {formatGrowth(growth.momGrowth.earnings)}
                  </span>
                </div>
              </div>
            )}

            {/* Ratings Growth */}
            {growth.momGrowth.ratings !== null && (
              <div className="rounded-lg bg-amber-50/50 p-3 text-center">
                <p className="mb-1 text-xs text-slate-600">Ratings</p>
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const Icon = getGrowthIcon(growth.momGrowth.ratings);
                    return (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          getGrowthColor(growth.momGrowth.ratings)
                        )}
                      />
                    );
                  })()}
                  <span
                    className={cn(
                      'text-lg font-bold',
                      getGrowthColor(growth.momGrowth.ratings)
                    )}
                  >
                    {formatGrowth(growth.momGrowth.ratings)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skill Progression */}
        {growth.skillProgressionRate !== null && (
          <div className="rounded-lg bg-purple-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  Skill Progression
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(getGrowthColor(growth.skillProgressionRate))}
              >
                {formatGrowth(growth.skillProgressionRate)}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Average skill level improvement this period
            </p>
          </div>
        )}

        {/* Certification Completion */}
        {growth.certificationCompletionRate !== null && (
          <div className="rounded-lg bg-indigo-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  Certifications
                </span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {growth.certificationCompletionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-600">Completed certifications</p>
          </div>
        )}

        {/* Assessment Improvement */}
        {growth.assessmentImprovement !== null && (
          <div className="rounded-lg bg-blue-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">
                  Assessment Improvement
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(getGrowthColor(growth.assessmentImprovement))}
              >
                {formatGrowth(growth.assessmentImprovement)}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Average assessment score improvement
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
