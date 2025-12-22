'use client';

/**
 * Quality Metrics Component
 * Displays quality indicators with progress bars
 */

import {
  CheckCircle2,
  Clock,
  FileCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type QualityMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function QualityMetrics({ metrics, className }: QualityMetricsProps) {
  const quality = metrics.quality;

  if (!quality) {
    return null;
  }

  const getQualityColor = (rate: number | null, reverse: boolean = false) => {
    if (!rate) return 'text-slate-400';
    const value = reverse ? 100 - rate : rate;
    if (value >= 90) return 'text-emerald-600';
    if (value >= 70) return 'text-blue-600';
    if (value >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number | null, reverse: boolean = false) => {
    if (!rate) return 'bg-slate-200';
    const value = reverse ? 100 - rate : rate;
    if (value >= 90) return 'bg-emerald-500';
    if (value >= 70) return 'bg-blue-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* On-Time Completion Rate */}
        {quality.onTimeCompletionRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">
                  On-Time Completion
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getQualityColor(quality.onTimeCompletionRate)
                )}
              >
                {quality.onTimeCompletionRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={quality.onTimeCompletionRate}
              className={cn(
                'h-2',
                getProgressColor(quality.onTimeCompletionRate)
              )}
            />
          </div>
        )}

        {/* Documentation Completion Rate */}
        {quality.documentationCompletionRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">
                  Documentation Complete
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getQualityColor(quality.documentationCompletionRate)
                )}
              >
                {quality.documentationCompletionRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={quality.documentationCompletionRate}
              className={cn(
                'h-2',
                getProgressColor(quality.documentationCompletionRate)
              )}
            />
          </div>
        )}

        {/* Late Check-in Rate */}
        {quality.lateCheckInRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">
                  Late Check-ins
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getQualityColor(quality.lateCheckInRate, true)
                )}
              >
                {quality.lateCheckInRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={quality.lateCheckInRate}
              className={cn(
                'h-2',
                getProgressColor(quality.lateCheckInRate, true)
              )}
            />
          </div>
        )}

        {/* No-Show Rate */}
        {quality.noShowRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-slate-700">
                  No-Show Rate
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getQualityColor(quality.noShowRate, true)
                )}
              >
                {quality.noShowRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={quality.noShowRate}
              className={cn('h-2', getProgressColor(quality.noShowRate, true))}
            />
          </div>
        )}

        {/* Issue Resolution Rate */}
        {quality.issueResolutionRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  Issue Resolution
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getQualityColor(quality.issueResolutionRate)
                )}
              >
                {quality.issueResolutionRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={quality.issueResolutionRate}
              className={cn(
                'h-2',
                getProgressColor(quality.issueResolutionRate)
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
