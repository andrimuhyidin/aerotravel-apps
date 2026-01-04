'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, QrCode, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeSubscription } from '@/lib/realtime/realtime-hooks';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type Trip = {
  id: string;
  trip_code: string;
  trip_date: string;
  status: string;
  total_pax: number;
  package?: { name: string | null } | null;
};

type TripsResponse = {
  trips: Trip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchTrips(filters: Record<string, unknown>): Promise<TripsResponse> {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
  const response = await fetch(`/api/admin/trips?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trips');
  }
  return response.json();
}

type TripsClientProps = {
  locale: string;
};

export function TripsClient({ locale }: TripsClientProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.trips.list({ status, page }),
    queryFn: () => fetchTrips({ status, page, limit: 50 }),
    staleTime: 30_000,
  });

  // Realtime subscription for trip status changes
  const handleTripUpdate = useCallback(() => {
    // Invalidate and refetch trips when any trip changes
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips.all() });
    toast.info('Trip data updated', { duration: 2000 });
  }, [queryClient]);

  const { isSubscribed: isRealtimeConnected } = useRealtimeSubscription<{ id: string; status: string }>(
    'admin-trips',
    {
      table: 'trips',
      event: 'UPDATE',
    },
    handleTripUpdate,
    true
  );

  const trips = data?.trips || [];

  const handleAutoAssign = async (tripId: string) => {
    setAssigning((prev) => ({ ...prev, [tripId]: true }));

    try {
      const res = await fetch(`/api/admin/trips/${tripId}/auto-assign`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        throw new Error(error.error || 'Gagal auto-assign');
      }

      const result = (await res.json()) as {
        assignment?: { guide_name?: string; reason?: string };
      };
      
      toast.success(
        `Trip berhasil di-assign ke ${result.assignment?.guide_name || 'guide'}. ${result.assignment?.reason || ''}`
      );
      
      // Invalidate trips to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips.all() });
    } catch (error) {
      logger.error('Failed to auto-assign trip', error, { tripId });
      toast.error((error as Error).message || 'Gagal auto-assign trip');
    } finally {
      setAssigning((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const handleNotify = async (tripId: string, type: 'h_minus_one' | 'h_day' | 'post_trip') => {
    setSending((prev) => ({ ...prev, [tripId]: true }));

    try {
      const res = await fetch(`/api/admin/trips/${tripId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim notifikasi');
      }

      const result = (await res.json()) as { sent: number; failed: number };
      toast.success(
        `Notifikasi terkirim ke ${result.sent} peserta. ${result.failed > 0 ? `${result.failed} gagal.` : ''}`
      );
    } catch (error) {
      logger.error('Failed to send trip notification', error, { tripId, type });
      toast.error('Gagal mengirim notifikasi');
    } finally {
      setSending((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Failed to load trips</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No trips found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => {
        const date = new Date(trip.trip_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const isSending = sending[trip.id];

        return (
          <Card key={trip.id} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{trip.package?.name ?? trip.trip_code}</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{trip.trip_code} • {date}</p>
                  <p className="text-xs text-slate-500">{trip.total_pax} pax</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {trip.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={assigning[trip.id]}
                  onClick={() => handleAutoAssign(trip.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  {assigning[trip.id] ? 'Assigning...' : 'Auto Assign'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'h_minus_one')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  H-1 Reminder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'h_day')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  H Reminder
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => handleNotify(trip.id, 'post_trip')}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Post-Trip
                </Button>
                <Link href={`/${locale}/trip/${trip.id}`} target="_blank">
                  <Button size="sm" variant="outline">
                    <QrCode className="mr-1 h-3 w-3" />
                    QR Code
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
