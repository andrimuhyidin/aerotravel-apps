'use client';

/**
 * Trip Summary Dialog Component
 * Shows trip summary after check-out (duration, distance, PAX, incidents)
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type TripSummaryDialogProps = {
  tripId: string;
  guideId: string;
  open: boolean;
  onClose: () => void;
  onReportIncident?: () => void;
  onNextTrip?: () => void;
};

type TripSummary = {
  tripId: string;
  tripCode: string | null;
  duration: {
    minutes: number | null;
    hours: string | null;
    formatted: string | null;
  };
  distance: {
    km: number;
    formatted: string;
  };
  pax: {
    total: number;
  };
  status: string;
  incidents: {
    count: number;
    hasIncidents: boolean;
    details: Array<{
      id: string;
      incident_type: string;
      severity: string;
      status: string;
    }>;
  };
  attendance: {
    checkInTime: string | null;
    checkOutTime: string | null;
    isLate: boolean;
    penaltyAmount: number;
  };
};

export function TripSummaryDialog({
  tripId,
  guideId,
  open,
  onClose,
  onReportIncident,
  onNextTrip,
}: TripSummaryDialogProps) {
  const { data, isLoading } = useQuery<TripSummary>({
    queryKey: queryKeys.guide.attendance?.tripSummary?.(tripId, guideId) || [
      'attendance',
      'trip-summary',
      tripId,
      guideId,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/attendance/trip-summary?tripId=${tripId}&guideId=${guideId}`
      );
      if (!res.ok) throw new Error('Failed to fetch trip summary');
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Trip Selesai
          </DialogTitle>
          <DialogDescription>
            Ringkasan trip {data?.tripCode || tripId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4 py-4">
            {/* Duration */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <Clock className="h-5 w-5 flex-shrink-0 text-slate-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">
                  Durasi Trip
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {data.duration.formatted || '-'}
                </p>
                {data.attendance.isLate && (
                  <p className="mt-1 text-xs text-red-600">
                    Check-in terlambat (Penalty: Rp{' '}
                    {data.attendance.penaltyAmount.toLocaleString()})
                  </p>
                )}
              </div>
            </div>

            {/* Distance */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <Navigation className="h-5 w-5 flex-shrink-0 text-slate-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">
                  Jarak Tempuh GPS
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {data.distance.formatted}
                </p>
              </div>
            </div>

            {/* PAX Count */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
              <Users className="h-5 w-5 flex-shrink-0 text-slate-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">
                  Jumlah Penumpang
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {data.pax.total} PAX
                </p>
              </div>
            </div>

            {/* Incidents */}
            {data.incidents.hasIncidents ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    {data.incidents.count} Insiden Dilaporkan
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Incident reports telah dicatat untuk trip ini.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">
                    Trip Berjalan Lancar
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Tidak ada insiden selama trip.
                  </p>
                </div>
              </div>
            )}

            {/* Location Summary */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="h-3 w-3" />
                <span>
                  Check-in:{' '}
                  {data.attendance.checkInTime
                    ? new Date(data.attendance.checkInTime).toLocaleTimeString(
                        'id-ID',
                        { hour: '2-digit', minute: '2-digit' }
                      )
                    : '-'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="h-3 w-3" />
                <span>
                  Check-out:{' '}
                  {data.attendance.checkOutTime
                    ? new Date(data.attendance.checkOutTime).toLocaleTimeString(
                        'id-ID',
                        { hour: '2-digit', minute: '2-digit' }
                      )
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {onReportIncident && !data?.incidents.hasIncidents && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onReportIncident();
                onClose();
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Laporkan Insiden
            </Button>
          )}
          {onNextTrip && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                onNextTrip();
                onClose();
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Lihat Trip Selanjutnya
            </Button>
          )}
          <Button
            variant={onNextTrip ? 'ghost' : 'default'}
            className="w-full"
            onClick={onClose}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
