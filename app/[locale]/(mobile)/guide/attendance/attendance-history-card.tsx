'use client';

/**
 * Attendance History Card Component
 * Shows recent attendance history with timeline
 */

import { Calendar, Clock, History, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AttendanceHistoryItem = {
  id: string;
  tripId: string;
  tripCode: string;
  tripName: string;
  tripDate: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: number | null; // in minutes
  isLate: boolean;
};

type AttendanceHistoryCardProps = {
  guideId: string;
  currentTripId: string;
};

export function AttendanceHistoryCard({ guideId, currentTripId }: AttendanceHistoryCardProps) {
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/guide/attendance/history?guideId=${encodeURIComponent(guideId)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [guideId]);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return null;
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <History className="h-5 w-5 text-blue-600" />
          Riwayat Absensi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'relative rounded-lg border p-3',
              item.tripId === currentTripId
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50',
            )}
          >
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-6 top-12 h-full w-0.5 bg-slate-200" />
            )}

            <div className="flex items-start gap-3">
              {/* Timeline dot */}
              <div
                className={cn(
                  'relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2',
                  item.tripId === currentTripId
                    ? 'border-emerald-500 bg-emerald-500'
                    : item.isLate
                      ? 'border-amber-500 bg-white'
                      : 'border-slate-400 bg-white',
                )}
              >
                <MapPin className={cn('h-3 w-3', item.tripId === currentTripId ? 'text-white' : 'text-slate-600')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{item.tripCode}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.tripName}</p>
                  </div>
                  {item.tripId === currentTripId && (
                    <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Trip Saat Ini
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{formatDate(item.tripDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">Check-in:</span>{' '}
                      <span>{formatTime(item.checkInTime)}</span>
                      {item.isLate && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                          Terlambat
                        </span>
                      )}
                    </div>
                  </div>

                  {item.checkOutTime && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">Check-out:</span>{' '}
                        <span>{formatTime(item.checkOutTime)}</span>
                        {item.duration && (
                          <span className="ml-2 text-slate-500">
                            ({formatDuration(item.duration)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
