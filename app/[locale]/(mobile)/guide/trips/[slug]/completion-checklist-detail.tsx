'use client';

/**
 * Completion Checklist Detail
 * Full detail content for the completion checklist dialog
 */

import {
    AlertCircle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

type CompletionChecklistDetailProps = {
  tripId: string;
  locale: string;
  isLeadGuide: boolean;
  status: CompletionStatus;
  onEndTrip?: () => void;
};

export function CompletionChecklistDetail({
  tripId,
  locale,
  isLeadGuide,
  status,
  onEndTrip,
}: CompletionChecklistDetailProps) {
  const router = useRouter();
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
        href: `/${locale}/guide/trips/${tripId}#manifest-section`,
      },
    },
    {
      key: 'documentationUploaded',
      label: 'Dokumentasi diupload',
      description: checklist.documentationUploaded.url ? 'Sudah diupload' : 'Belum diupload',
      done: checklist.documentationUploaded.done,
      applicable: checklist.documentationUploaded.applicable,
      action: {
        label: 'Upload Dokumentasi',
        href: `/${locale}/guide/trips/${tripId}#documentation-section`,
      },
    },
    {
      key: 'logisticsHandoverCompleted',
      label: 'Logistics handover selesai',
      description: checklist.logisticsHandoverCompleted.inboundHandoverId ? 'Sudah selesai' : 'Belum selesai',
      done: checklist.logisticsHandoverCompleted.done,
      applicable: checklist.logisticsHandoverCompleted.applicable,
      action: {
        label: 'Lakukan Handover',
        href: `/${locale}/guide/trips/${tripId}#handover-section`,
      },
    },
    {
      key: 'attendanceCheckedOut',
      label: 'Attendance check-out',
      description: checklist.attendanceCheckedOut.checkOutTime ? 'Sudah check-out' : 'Belum check-out',
      done: checklist.attendanceCheckedOut.done,
      applicable: checklist.attendanceCheckedOut.applicable,
      action: {
        label: 'Check-Out Attendance',
        href: `/${locale}/guide/attendance?trip_id=${tripId}`,
      },
    },
    {
      key: 'requiredTasksCompleted',
      label: 'Semua task wajib selesai',
      description: checklist.requiredTasksCompleted.pendingTasks.length > 0
        ? `${checklist.requiredTasksCompleted.pendingTasks.length} task pending`
        : 'Semua task selesai',
      done: checklist.requiredTasksCompleted.done,
      applicable: checklist.requiredTasksCompleted.applicable,
      action: {
        label: 'Lihat Tasks',
        href: `/${locale}/guide/trips/${tripId}#tasks-section`,
      },
    },
  ];

  const optionalItems = [
    {
      key: 'expensesSubmitted',
      label: 'Expenses submitted',
      description: checklist.expensesSubmitted.done ? 'Sudah submit' : 'Belum submit',
      done: checklist.expensesSubmitted.done,
      warning: checklist.expensesSubmitted.warning,
      applicable: checklist.expensesSubmitted.applicable,
    },
    {
      key: 'paymentSplitCalculated',
      label: 'Payment split calculated',
      description: checklist.paymentSplitCalculated.done ? 'Sudah dihitung' : 'Belum dihitung',
      done: checklist.paymentSplitCalculated.done,
      warning: checklist.paymentSplitCalculated.warning,
      applicable: checklist.paymentSplitCalculated.applicable,
    },
  ].filter((item) => item.applicable);

  const handleEndTrip = async () => {
    if (!status.canComplete) {
      return;
    }

    if (confirm('Yakin ingin menyelesaikan trip ini?')) {
      if (onEndTrip) {
        onEndTrip();
      }
    }
  };

  const handleActionClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            Progress: {progress.completed}/{progress.total} Complete
          </span>
          <span className="text-slate-600">{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} className="h-2" />
      </div>

      {/* Required Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">Item Wajib</h4>
        {requiredItems
          .filter((item) => item.applicable)
          .map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                item.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-amber-200 bg-amber-50/50',
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                {!item.done && item.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleActionClick(item.action.href)}
                  >
                    {item.action.label}
                  </Button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Item Opsional</h4>
          {optionalItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                item.done
                  ? 'border-slate-200 bg-slate-50'
                  : item.warning
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200 bg-white',
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-slate-600" />
                ) : item.warning ? (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-900">Peringatan</p>
              <ul className="mt-1 space-y-0.5">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* End Trip Button */}
      <Button
        onClick={handleEndTrip}
        disabled={!status.canComplete}
        className={cn(
          'w-full font-semibold',
          status.canComplete
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-slate-300 text-slate-600 cursor-not-allowed',
        )}
        size="lg"
      >
        {status.canComplete ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            End Trip ({progress.completed}/{progress.total} Complete)
          </>
        ) : (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Tidak Dapat End Trip ({progress.completed}/{progress.total} Complete)
          </>
        )}
      </Button>
    </div>
  );
}
