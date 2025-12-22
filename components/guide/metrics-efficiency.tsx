'use client';

/**
 * Efficiency Metrics Component
 * Displays efficiency and productivity metrics with charts
 */

import { Clock, DollarSign, TrendingUp, Users, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type EfficiencyMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function EfficiencyMetrics({
  metrics,
  className,
}: EfficiencyMetricsProps) {
  const efficiency = metrics.efficiency;

  if (!efficiency) {
    return null;
  }

  const formatDuration = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Efficiency & Productivity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Average Trip Duration */}
          {efficiency.avgTripDuration !== null && (
            <div className="rounded-lg bg-blue-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-700">
                  Avg Trip Duration
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatDuration(efficiency.avgTripDuration)}
              </p>
            </div>
          )}

          {/* Guest-to-Trip Ratio */}
          {efficiency.guestToTripRatio !== null && (
            <div className="rounded-lg bg-purple-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-slate-700">
                  Guests per Trip
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {efficiency.guestToTripRatio.toFixed(1)}
              </p>
            </div>
          )}

          {/* Revenue per Guest */}
          {efficiency.revenuePerGuest !== null && (
            <div className="rounded-lg bg-emerald-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-700">
                  Revenue per Guest
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(efficiency.revenuePerGuest)}
              </p>
            </div>
          )}

          {/* Utilization Rate */}
          {efficiency.utilizationRate !== null && (
            <div className="rounded-lg bg-amber-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-slate-700">
                  Utilization Rate
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">
                  {efficiency.utilizationRate.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Average Response Time */}
          {efficiency.avgResponseTime !== null && (
            <div className="col-span-2 rounded-lg bg-indigo-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-slate-700">
                  Avg Response Time
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatDuration(efficiency.avgResponseTime)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
