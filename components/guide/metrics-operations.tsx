'use client';

/**
 * Operations Metrics Component
 * Displays operational efficiency and compliance metrics
 */

import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  DollarSign,
  ListTodo,
  Clock,
  Package,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type OperationsMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function OperationsMetrics({
  metrics,
  className,
}: OperationsMetricsProps) {
  const operations = metrics.operations;

  if (!operations) {
    return null;
  }

  const getRateColor = (rate: number | null) => {
    if (!rate) return 'text-slate-400';
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number | null) => {
    if (!rate) return 'bg-slate-200';
    if (rate >= 90) return 'bg-emerald-500';
    if (rate >= 70) return 'bg-blue-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const metricsList = [
    {
      label: 'Equipment Checklist',
      rate: operations.equipmentChecklistRate,
      icon: ClipboardCheck,
      color: 'blue',
    },
    {
      label: 'Risk Assessment',
      rate: operations.riskAssessmentRate,
      icon: CheckCircle2,
      color: 'red',
    },
    {
      label: 'Documentation Upload',
      rate: operations.documentationUploadRate,
      icon: FileText,
      color: 'purple',
    },
    {
      label: 'Expense Submission',
      rate: operations.expenseSubmissionRate,
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Task Completion',
      rate: operations.taskCompletionRate,
      icon: ListTodo,
      color: 'indigo',
    },
    {
      label: 'Attendance Compliance',
      rate: operations.attendanceComplianceRate,
      icon: Clock,
      color: 'amber',
    },
    {
      label: 'Logistics Handover',
      rate: operations.logisticsHandoverRate,
      icon: Package,
      color: 'slate',
    },
  ];

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Operations & Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {metricsList.map((metric) => {
          if (metric.rate === null) return null;

          const Icon = metric.icon;
          return (
            <div key={metric.label}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', `text-${metric.color}-600`)} />
                  <span className="text-sm font-medium text-slate-700">
                    {metric.label}
                  </span>
                </div>
                <span
                  className={cn('text-sm font-bold', getRateColor(metric.rate))}
                >
                  {metric.rate.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={metric.rate}
                className={cn('h-2', getProgressColor(metric.rate))}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
