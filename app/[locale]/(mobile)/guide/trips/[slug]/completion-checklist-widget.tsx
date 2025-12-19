'use client';

/**
 * Completion Checklist Widget
 * Compact widget that opens a dialog with full checklist details
 */

import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronRight,
    ClipboardList,
} from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { CompletionChecklistDetail } from './completion-checklist-detail';

type CompletionChecklistWidgetProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
  onEndTrip?: () => void;
};

type CompletionStatus = {
  canComplete: boolean;
  checklist: {
    allPassengersReturned: { done: boolean; current: number; required: number; applicable: boolean };
    documentationUploaded: { done: boolean; url: string | null; applicable: boolean };
    logisticsHandoverCompleted: { done: boolean; inboundHandoverId: string | null; applicable: boolean };
    attendanceCheckedOut: { done: boolean; checkOutTime: string | null; applicable: boolean };
    requiredTasksCompleted: { done: boolean; pendingTasks: string[]; applicable: boolean };
    expensesSubmitted: { done: boolean; warning: boolean; applicable: boolean };
    paymentSplitCalculated: { done: boolean; warning: boolean; applicable: boolean };
  };
  missingItems: string[];
  warnings: string[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
};

export function CompletionChecklistWidget({
  tripId,
  locale,
  isLeadGuide,
  onEndTrip,
}: CompletionChecklistWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: status, isLoading, error } = useQuery<CompletionStatus>({
    queryKey: queryKeys.guide.trips.completionStatus(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/completion-status`);
      if (!res.ok) {
        // If trip is not yet active, API might return 400/404 - handle gracefully
        if (res.status === 400 || res.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch completion status');
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

  // If no status (trip not active yet) or error, show placeholder widget
  if (!status || error) {
    return (
      <Card
        className="border-slate-200 bg-slate-50/50 cursor-pointer hover:shadow-md transition-all"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200">
              <ClipboardList className="h-6 w-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Trip Completion Checklist
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-600">
                Checklist akan tersedia saat trip sudah aktif
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { progress } = status;

  return (
    <>
      {/* Widget - Compact */}
      <Card
        className={cn(
          'border-2 transition-all cursor-pointer hover:shadow-md',
          status.canComplete
            ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
            : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
        )}
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                status.canComplete
                  ? 'bg-emerald-100'
                  : 'bg-amber-100',
              )}
            >
              {status.canComplete ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <ClipboardList className="h-6 w-6 text-amber-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Trip Completion Checklist
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    {progress.completed}/{progress.total} Complete
                  </span>
                  <span className="text-slate-600">{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-1.5" />
                {status.canComplete ? (
                  <p className="text-xs font-semibold text-emerald-700">
                    ✅ Siap untuk menyelesaikan trip
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    ⚠️ {status.missingItems.length} item belum selesai
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog with Full Details */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Trip Completion Checklist
            </DialogTitle>
            <DialogDescription>
              {status
                ? 'Semua item wajib harus selesai sebelum trip dapat di-mark complete'
                : 'Checklist akan tersedia saat trip sudah aktif'}
            </DialogDescription>
          </DialogHeader>
          {status ? (
            <CompletionChecklistDetail
              tripId={tripId}
              locale={locale}
              isLeadGuide={isLeadGuide}
              status={status}
              onEndTrip={onEndTrip}
            />
          ) : (
            <div className="py-8 text-center">
              <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600">
                Checklist completion akan tersedia setelah trip dimulai
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
