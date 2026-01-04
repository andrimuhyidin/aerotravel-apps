'use client';

/**
 * Trip Readiness Widget
 * Compact widget that opens a dialog with full readiness status details
 */

import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronRight,
    ShieldCheck,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TripReadinessWidgetProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
  onOpenDialog?: () => void;
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

export function TripReadinessWidget({
  tripId,
  locale,
  isLeadGuide,
  onOpenDialog,
}: TripReadinessWidgetProps) {
  const { data: status, isLoading, error } = useQuery<ReadinessStatus>({
    queryKey: queryKeys.guide.trips.canStart(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/can-start`);
      if (!res.ok) {
        // If trip is already started, API might return 400/404 - handle gracefully
        if (res.status === 400 || res.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch readiness status');
      }
      return res.json();
    },
    refetchInterval: 10000,
    enabled: isLeadGuide, // Only fetch if lead guide
    retry: false, // Don't retry on error
  });

  if (!isLeadGuide) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-slate-200 rounded w-32 mb-2 animate-pulse" />
              <div className="h-3 bg-slate-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no status (trip already started) or error, show placeholder widget
  if (!status || error) {
    const handlePlaceholderClick = () => {
      if (onOpenDialog) {
        onOpenDialog();
      }
    };

    return (
      <Card
        className="border-slate-200 bg-slate-50/50 cursor-pointer hover:shadow-md transition-all"
        onClick={handlePlaceholderClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlaceholderClick();
          }
        }}
      >
        <CardContent className="p-4 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200">
              <ShieldCheck className="h-6 w-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Status Kesiapan Start Trip
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-600">
                Trip sudah dimulai atau status tidak tersedia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress (number of completed requirements)
  const requirements = [
    status.attendance_checked_in,
    status.facility_checklist.complete,
    status.equipment_checklist.complete,
    status.risk_assessment.exists,
    status.certifications_valid,
  ];
  const completedCount = requirements.filter(Boolean).length;
  const totalCount = requirements.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleClick = () => {
    if (onOpenDialog) {
      onOpenDialog();
    }
  };

  return (
    <Card
      className={cn(
        'border-2 transition-all cursor-pointer hover:shadow-md',
        status.can_start
          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
          : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CardContent className="p-4 pointer-events-none">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
              status.can_start
                ? 'bg-emerald-100'
                : 'bg-amber-100',
            )}
          >
            {status.can_start ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-amber-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Status Kesiapan Start Trip
              </h3>
              <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {completedCount}/{totalCount} Requirements
                </span>
                <span className="text-slate-600">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
              {status.can_start ? (
                <p className="text-xs font-semibold text-emerald-700">
                  ✅ Siap untuk memulai trip
                </p>
              ) : (
                <p className="text-xs font-semibold text-amber-700">
                  ⚠️ {status.reasons?.length || 0} item belum selesai
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
