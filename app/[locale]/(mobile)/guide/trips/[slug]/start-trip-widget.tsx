'use client';

/**
 * Start Trip Widget Component
 * Prominent button untuk start trip dengan readiness status
 * Opens Risk Assessment dialog if needed
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { RiskAssessmentDialog } from './risk-assessment-dialog';

type StartTripWidgetProps = {
  tripId: string;
  locale: string;
  canStart?: boolean;
  onStart?: () => void;
  isLeadGuide: boolean;
};

type ReadinessStatus = {
  can_start: boolean;
  attendance_checked_in: boolean;
  facility_checklist: {
    complete: boolean;
    checked: number;
    total: number;
  };
  equipment_checklist: {
    complete: boolean;
    checked: number;
    total: number;
  };
  risk_assessment: {
    exists: boolean;
    safe: boolean;
  };
  certifications_valid: boolean;
  admin_approval_complete: boolean;
  manifest: {
    boarded: number;
    total: number;
    percentage: number;
  };
  reasons?: string[];
};

export function StartTripWidget({
  tripId,
  locale: _locale,
  canStart: canStartProp,
  onStart,
  isLeadGuide,
}: StartTripWidgetProps) {
  const [riskAssessmentOpen, setRiskAssessmentOpen] = useState(false);

  const { data: status, isLoading } = useQuery<ReadinessStatus>({
    queryKey: queryKeys.guide.trips.canStart(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/can-start`);
      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch readiness status');
      }
      return res.json();
    },
    refetchInterval: 10000,
    enabled: isLeadGuide,
    retry: false,
  });

  if (!isLeadGuide) {
    return null;
  }

  const canStart = canStartProp ?? status?.can_start ?? false;
  const readinessStatus = status;

  // Calculate progress
  const requirements = readinessStatus
    ? [
        readinessStatus.attendance_checked_in,
        readinessStatus.facility_checklist.complete,
        readinessStatus.equipment_checklist.complete,
        readinessStatus.risk_assessment.exists,
        readinessStatus.certifications_valid,
      ]
    : [];
  const completedCount = requirements.filter(Boolean).length;
  const totalCount = requirements.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStartClick = () => {
    // Always open risk assessment dialog first
    setRiskAssessmentOpen(true);
  };

  const handleRiskAssessmentComplete = (canStartAfterAssessment: boolean) => {
    setRiskAssessmentOpen(false);
    if (canStartAfterAssessment && onStart) {
      // onStart will handle the actual trip start API call
      // RiskAssessmentDialog already handles starting the trip if canStart = true
    }
  };

  return (
    <>
      <Card
        className={cn(
          'border-2 transition-all',
          canStart
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-amber-200 bg-amber-50/50',
        )}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                canStart ? 'bg-emerald-100' : 'bg-amber-100',
              )}
            >
              {canStart ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">Siap untuk Memulai Trip?</h3>
              {isLoading ? (
                <p className="text-xs text-slate-600 mt-1">Memeriksa status...</p>
              ) : readinessStatus ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {completedCount}/{totalCount} Requirements
                    </span>
                    <span className="text-slate-600">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {canStart ? (
                    <p className="text-xs font-semibold text-emerald-700">
                      ✅ Semua requirement sudah terpenuhi
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-amber-700">
                      ⚠️ {readinessStatus.reasons?.length || 0} item belum selesai
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-1">
                  Status tidak tersedia
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleStartClick}
            disabled={isLoading}
            className={cn(
              'w-full font-semibold py-6 shadow-sm',
              canStart
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed',
            )}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                {canStart ? 'Mulai Trip' : 'Mulai Trip (Belum Siap)'}
              </>
            )}
          </Button>

          {!canStart && readinessStatus?.reasons && readinessStatus.reasons.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900 mb-1.5">Item yang perlu diselesaikan:</p>
              <ul className="space-y-1">
                {readinessStatus.reasons.map((reason, index) => (
                  <li key={index} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <RiskAssessmentDialog
        open={riskAssessmentOpen}
        onOpenChange={setRiskAssessmentOpen}
        onComplete={handleRiskAssessmentComplete}
        tripId={tripId}
      />
    </>
  );
}

