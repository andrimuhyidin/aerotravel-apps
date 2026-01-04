'use client';

/**
 * Attendance History Client Component
 * Full history page untuk attendance dengan filter dan pagination
 */

import { Clock, History, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type AttendanceHistoryClientProps = {
  guideId: string;
  locale: string;
};

export function AttendanceHistoryClient({ guideId, locale: _locale }: AttendanceHistoryClientProps) {
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/guide/attendance/history?guideId=${encodeURIComponent(guideId)}&limit=${limit}`,
        );
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
          setHasMore((data.history || []).length >= limit);
        }
      } catch (_error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [guideId, limit]);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const _formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
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

  // Group by date
  const groupedHistory = history.reduce((acc, item) => {
    const date = new Date(item.tripDate).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, AttendanceHistoryItem[]>);

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-slate-600">Memuat riwayat absensi...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <History className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Belum Ada Riwayat</h3>
          <p className="mt-2 text-sm text-slate-600">
            Riwayat absensi akan muncul setelah Anda melakukan check-in dan check-out
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{history.length}</p>
            <p className="mt-1 text-xs text-slate-600">Total Trip</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {history.filter((h) => !h.isLate).length}
            </p>
            <p className="mt-1 text-xs text-slate-600">On Time</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {history.filter((h) => h.isLate).length}
            </p>
            <p className="mt-1 text-xs text-slate-600">Terlambat</p>
          </CardContent>
        </Card>
      </div>

      {/* History Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-sm font-semibold text-slate-700">{date}</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    'border-0 shadow-sm transition-all hover:shadow-md',
                    item.isLate && 'border-l-4 border-l-amber-500',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                          item.isLate ? 'bg-amber-100' : 'bg-emerald-100',
                        )}
                      >
                        <MapPin
                          className={cn('h-5 w-5', item.isLate ? 'text-amber-600' : 'text-emerald-600')}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">{item.tripCode}</p>
                            <p className="mt-0.5 text-sm text-slate-600">{item.tripName}</p>
                          </div>
                          {item.isLate && (
                            <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Terlambat
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            <div className="flex-1">
                              <span className="font-medium">Check-in:</span>{' '}
                              <span>{formatTime(item.checkInTime)}</span>
                            </div>
                          </div>

                          {item.checkOutTime && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setLimit((prev) => prev + 20)}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
          </Button>
        </div>
      )}
    </div>
  );
}
