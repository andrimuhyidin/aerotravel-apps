'use client';

/**
 * Completion Checklist Component
 * Displays trip completion requirements and blocks End Trip if not met
 */

import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Loader2,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type CompletionChecklistProps = {
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

export function CompletionChecklist({
  tripId,
  locale,
  isLeadGuide,
  onEndTrip,
}: CompletionChecklistProps) {
  const router = useRouter();

  const { data: status, isLoading, refetch } = useQuery<CompletionStatus>({
    queryKey: queryKeys.guide.trips.completionStatus(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/completion-status`);
      if (!res.ok) throw new Error('Failed to fetch completion status');
      return res.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            <span className="text-sm text-slate-600">Memuat checklist...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const { checklist, progress, missingItems, warnings } = status;

  // Filter applicable items for display
  const requiredItems = [
    {
      key: 'allPassengersReturned',
      label: 'Semua tamu kembali',
      description: checklist.allPassengersReturned.applicable
        ? `${checklist.allPassengersReturned.current}/${checklist.allPassengersReturned.required} tamu`
        : 'N/A',
      done: checklist.allPassengersReturned.done,
      applicable: checklist.allPassengersReturned.applicable,
      action: {
        label: 'Update Manifest',
        href: `#manifest-section`,
      },
    },
    {
      key: 'documentationUploaded',
      label: 'Dokumentasi diupload',
      description: checklist.documentationUploaded.applicable
        ? checklist.documentationUploaded.done
          ? 'Link dokumentasi sudah diupload'
          : 'Upload link Google Drive dokumentasi'
        : 'N/A',
      done: checklist.documentationUploaded.done,
      applicable: checklist.documentationUploaded.applicable,
      action: {
        label: 'Upload Dokumentasi',
        href: `#documentation-section`,
      },
    },
    {
      key: 'logisticsHandoverCompleted',
      label: 'Logistics handover (inbound)',
      description: checklist.logisticsHandoverCompleted.applicable
        ? checklist.logisticsHandoverCompleted.done
          ? 'Handover sudah selesai & verified'
          : 'Kembalikan barang ke warehouse'
        : 'Tidak ada inventory items',
      done: checklist.logisticsHandoverCompleted.done,
      applicable: checklist.logisticsHandoverCompleted.applicable,
      action: {
        label: 'Lihat Handover',
        href: `#handover-section`,
      },
    },
    {
      key: 'attendanceCheckedOut',
      label: 'Attendance check-out',
      description: checklist.attendanceCheckedOut.applicable
        ? checklist.attendanceCheckedOut.done
          ? `Check-out: ${checklist.attendanceCheckedOut.checkOutTime ? new Date(checklist.attendanceCheckedOut.checkOutTime).toLocaleTimeString('id-ID') : ''}`
          : 'Lakukan check-out dari trip'
        : 'N/A',
      done: checklist.attendanceCheckedOut.done,
      applicable: checklist.attendanceCheckedOut.applicable,
      action: {
        label: 'Check-Out',
        href: `/${locale}/guide/attendance?tripId=${tripId}`,
      },
    },
    {
      key: 'requiredTasksCompleted',
      label: 'Required tasks selesai',
      description: checklist.requiredTasksCompleted.applicable
        ? checklist.requiredTasksCompleted.done
          ? 'Semua required tasks sudah selesai'
          : `${checklist.requiredTasksCompleted.pendingTasks.length} tasks pending`
        : 'Tidak ada required tasks',
      done: checklist.requiredTasksCompleted.done,
      applicable: checklist.requiredTasksCompleted.applicable,
      action: {
        label: 'Lihat Tasks',
        href: `#tasks-section`,
      },
    },
  ].filter((item) => item.applicable);

  const optionalItems = [
    {
      key: 'expensesSubmitted',
      label: 'Expenses di-submit',
      description: checklist.expensesSubmitted.done
        ? 'Expenses sudah di-submit'
        : 'Submit expenses untuk reimbursement',
      done: checklist.expensesSubmitted.done,
      warning: checklist.expensesSubmitted.warning,
      applicable: checklist.expensesSubmitted.applicable,
      action: {
        label: 'Submit Expenses',
        href: `/${locale}/guide/trips/${tripId}/expenses`,
      },
    },
    {
      key: 'paymentSplitCalculated',
      label: 'Payment split dihitung',
      description: checklist.paymentSplitCalculated.done
        ? 'Payment split sudah dihitung'
        : 'Hitung payment split untuk multi-guide',
      done: checklist.paymentSplitCalculated.done,
      warning: checklist.paymentSplitCalculated.warning,
      applicable: checklist.paymentSplitCalculated.applicable,
      action: {
        label: 'Lihat Payment Split',
        href: `#payment-split-section`,
      },
    },
  ].filter((item) => item.applicable);

  const getIcon = (done: boolean) => {
    if (done) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = (done: boolean) => {
    return done ? 'text-emerald-700' : 'text-red-700';
  };

  const handleEndTrip = async () => {
    if (!status.canComplete) {
      return;
    }

    try {
      const res = await fetch(`/api/guide/trips/${tripId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to end trip');
      }

      // Invalidate queries to refresh data
      await refetch();

      if (onEndTrip) {
        onEndTrip();
      } else {
        router.refresh();
      }
    } catch (error) {
      logger.error('Failed to end trip', error, { tripId });
    }
  };

  if (!isLeadGuide) {
    // Support guides can view but not complete
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Trip Completion Checklist</CardTitle>
          <p className="text-sm text-slate-600">
            Hanya Lead Guide yang dapat menyelesaikan trip
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {requiredItems.map((item) => (
            <div key={item.key} className="flex items-start gap-3">
              {getIcon(item.done)}
              <div className="flex-1">
                <p className={cn('text-sm font-medium', getStatusColor(item.done))}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      id="completion-checklist"
      data-completion-checklist
      className={cn(
        'border-2 transition-colors',
        status.canComplete
          ? 'border-emerald-200 bg-emerald-50/50'
          : 'border-amber-200 bg-amber-50/50'
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Trip Completion Checklist
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Semua item wajib harus selesai sebelum trip dapat di-mark complete
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Progress: {progress.completed}/{progress.total} Complete
            </span>
            <span className="text-slate-600">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Required Items */}
        <div className="space-y-3">
          {requiredItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                item.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-red-200 bg-red-50/50'
              )}
            >
              {getIcon(item.done)}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', getStatusColor(item.done))}>
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                {!item.done && item.action && (
                  <div className="mt-2">
                    {item.action.href.startsWith('#') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const element = document.querySelector(item.action.href.replace('#', ''));
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="h-7 text-xs"
                      >
                        {item.action.label}
                      </Button>
                    ) : (
                      <Link href={item.action.href}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          {item.action.label}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Optional Items (Warnings) */}
        {optionalItems.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Optional (Warning)
            </p>
            {optionalItems.map((item) => (
              <div
                key={item.key}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3',
                  item.done
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    item.done ? 'text-emerald-700' : 'text-amber-700'
                  )}>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                  {!item.done && item.action && (
                    <div className="mt-2">
                      {item.action.href.startsWith('#') ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const element = document.querySelector(item.action.href.replace('#', ''));
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          {item.action.label}
                        </Button>
                      ) : (
                        <Link href={item.action.href}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            {item.action.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Missing Items Summary */}
        {missingItems.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-900 mb-2">Item yang masih pending:</p>
            <ul className="space-y-1">
              {missingItems.map((item, index) => (
                <li key={index} className="text-xs text-red-800 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings Summary */}
        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900 mb-2">Peringatan:</p>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* End Trip Section */}
        <div className="pt-4 border-t-2 border-slate-200 space-y-3">
          {/* Summary Status */}
          <div
            className={cn(
              'rounded-lg border-2 p-3',
              status.canComplete
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-200 bg-amber-50/50',
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  status.canComplete ? 'bg-emerald-100' : 'bg-amber-100',
                )}
              >
                {status.canComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs font-semibold',
                    status.canComplete ? 'text-emerald-900' : 'text-amber-900',
                  )}
                >
                  {status.canComplete
                    ? 'Siap untuk diselesaikan'
                    : `${missingItems.length} item belum selesai`}
                </p>
              </div>
            </div>
          </div>

          {/* End Trip Button */}
          <Button
            onClick={handleEndTrip}
            disabled={!status.canComplete}
            className={cn(
              'w-full font-semibold py-5 shadow-sm',
              status.canComplete
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed',
            )}
          >
            {status.canComplete ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Selesaikan Trip</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>Tidak Dapat Menyelesaikan</span>
              </div>
            )}
          </Button>

          {/* Helper Text */}
          {!status.canComplete && (
            <p className="text-xs text-center text-slate-600 leading-relaxed">
              Lengkapi semua item wajib untuk dapat menyelesaikan trip
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
