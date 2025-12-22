'use client';

/**
 * Chat Client Component
 * Lists all trips with active chat conversations
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type ChatClientProps = {
  locale: string;
};

type TripChatItem = {
  id: string;
  tripCode: string;
  tripName: string;
  date: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
};

export function ChatClient({ locale }: ChatClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryResult = useQuery<TripChatItem[]>({
    queryKey: queryKeys.guide.trips.all(),
    queryFn: async () => {
      const res = await fetch('/api/guide/trips');
      if (!res.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = (await res.json()) as { trips: Array<{
        id: string;
        code?: string;
        name?: string;
        date?: string;
      }> };
      
      // Transform to chat items
      return (data.trips ?? [])
        .filter((trip) => trip && trip.id)
        .slice(0, 20)
        .map((trip) => ({
          id: trip.id,
          tripCode: trip.code ?? '',
          tripName: trip.name ?? '',
          date: trip.date ?? '',
          unreadCount: 0, // Can be enhanced later with real unread count
        }));
    },
    enabled: mounted,
  });

  const { data: trips, isLoading, error, refetch } = queryResult;

  if (!mounted) {
    return <LoadingState variant="skeleton-card" lines={3} message="Memuat chat..." />;
  }

  if (isLoading) {
    return <LoadingState variant="skeleton-card" lines={3} message="Memuat chat..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Gagal memuat chat'}
        onRetry={() => void refetch()}
        variant="card"
      />
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Belum ada trip"
        description="Trip dengan chat akan muncul di sini"
        variant="subtle"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chat</h1>
        <p className="mt-1 text-sm text-slate-600">
          Komunikasi dengan tim operasional per trip
        </p>
      </div>

      <div className="space-y-2">
        {trips.map((trip) => {
          if (!trip || !trip.id || !trip.date) {
            return null; // Skip invalid trips
          }

          let dateLabel = 'Tanggal tidak tersedia';
          try {
            const date = new Date(trip.date);
            if (!isNaN(date.getTime())) {
              dateLabel = date.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
            }
          } catch {
            // Keep default dateLabel
          }

          return (
            <Link
              key={trip.id}
              href={`/${locale}/guide/trips/${trip.tripCode || trip.id}/chat`}
              className="block"
            >
              <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {trip.tripName || 'Trip tanpa nama'}
                        </h3>
                        {trip.unreadCount && trip.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                            {trip.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        {trip.tripCode || trip.id} • {dateLabel}
                      </p>
                      {trip.lastMessage && (
                        <p className="text-sm text-slate-700 line-clamp-1">
                          {trip.lastMessage}
                        </p>
                      )}
                      {trip.lastMessageTime && (
                        <p className="text-xs text-slate-500 mt-1">
                          {trip.lastMessageTime}
                        </p>
                      )}
                    </div>
                    <MessageSquare className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
