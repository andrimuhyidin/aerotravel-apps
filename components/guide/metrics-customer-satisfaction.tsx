'use client';

/**
 * Customer Satisfaction Metrics Component
 * Displays customer satisfaction related metrics
 */

import { MessageSquare, Repeat, ShieldCheck, Star } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type CustomerSatisfactionMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function CustomerSatisfactionMetrics({
  metrics,
  className,
}: CustomerSatisfactionMetricsProps) {
  const satisfaction = metrics.customerSatisfaction;

  if (!satisfaction) {
    return null;
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Customer Satisfaction
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Response Rate */}
          {satisfaction.responseRate !== null && (
            <div className="rounded-lg bg-blue-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-slate-700">
                  Response Rate
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-bold',
                    getScoreColor(satisfaction.responseRate)
                  )}
                >
                  {satisfaction.responseRate.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={satisfaction.responseRate}
                className="mt-2 h-1.5"
              />
            </div>
          )}

          {/* Repeat Customer Rate */}
          {satisfaction.repeatCustomerRate !== null && (
            <div className="rounded-lg bg-purple-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-slate-700">
                  Repeat Customers
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-bold',
                    getScoreColor(satisfaction.repeatCustomerRate)
                  )}
                >
                  {satisfaction.repeatCustomerRate.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={satisfaction.repeatCustomerRate}
                className="mt-2 h-1.5"
              />
            </div>
          )}

          {/* Complaint Resolution Rate */}
          {satisfaction.complaintResolutionRate !== null && (
            <div className="rounded-lg bg-emerald-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-700">
                  Complaint Resolution
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-bold',
                    getScoreColor(satisfaction.complaintResolutionRate)
                  )}
                >
                  {satisfaction.complaintResolutionRate.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={satisfaction.complaintResolutionRate}
                className="mt-2 h-1.5"
              />
            </div>
          )}

          {/* Satisfaction Score */}
          {satisfaction.satisfactionScore !== null && (
            <div className="rounded-lg bg-amber-50/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-slate-700">
                  Satisfaction Score
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-bold',
                    getScoreColor(satisfaction.satisfactionScore * 20)
                  )}
                >
                  {satisfaction.satisfactionScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/5.0</span>
              </div>
              <Progress
                value={satisfaction.satisfactionScore * 20}
                className="mt-2 h-1.5"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
