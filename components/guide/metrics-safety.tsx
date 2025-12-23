'use client';

/**
 * Safety Metrics Component
 * Displays safety and compliance metrics
 */

import { AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type SafetyMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function SafetyMetrics({ metrics, className }: SafetyMetricsProps) {
  const safety = metrics.safety;

  if (!safety) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Safety & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Shield}
            title="Belum ada data safety"
            description="Data safety akan muncul setelah Anda melakukan risk assessment dan melaporkan incident (jika ada)."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
  }

  // Check if any data exists
  const hasData =
    safety.incidentFrequency !== undefined ||
    safety.riskAssessmentFrequency !== undefined ||
    safety.safetyComplianceScore !== null ||
    safety.preTripReadinessRate !== null;

  if (!hasData) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Safety & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Shield}
            title="Belum ada data safety"
            description="Data safety akan muncul setelah Anda melakukan risk assessment dan melaporkan incident (jika ada)."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
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

  const getIncidentColor = (frequency: number) => {
    if (frequency === 0) return 'text-emerald-600';
    if (frequency < 5) return 'text-blue-600';
    if (frequency < 10) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Safety & Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Safety Compliance Score */}
        {safety.safetyComplianceScore !== null && (
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                Safety Compliance Score
              </span>
            </div>
            <Badge
              className={cn(
                'px-4 py-2 text-2xl font-bold',
                getScoreBadgeColor(safety.safetyComplianceScore)
              )}
            >
              {safety.safetyComplianceScore}/100
            </Badge>
          </div>
        )}

        {/* Incident Frequency */}
        <div className="rounded-lg bg-slate-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                Incident Frequency
              </span>
            </div>
            <span
              className={cn(
                'text-lg font-bold',
                getIncidentColor(safety.incidentFrequency)
              )}
            >
              {safety.incidentFrequency.toFixed(1)} per 100 trips
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">Lower is better</p>
        </div>

        {/* Risk Assessment Frequency */}
        <div className="rounded-lg bg-purple-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">
                Risk Assessments
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {safety.riskAssessmentFrequency.toFixed(2)} per trip
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Average risk assessments completed
          </p>
        </div>

        {/* Pre-Trip Readiness Rate */}
        {safety.preTripReadinessRate !== null && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">
                  Pre-Trip Readiness
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getScoreColor(safety.preTripReadinessRate)
                )}
              >
                {safety.preTripReadinessRate.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={safety.preTripReadinessRate}
              className={cn(
                'h-2',
                getScoreColor(safety.preTripReadinessRate) ===
                  'text-emerald-600'
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
