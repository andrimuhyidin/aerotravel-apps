'use client';

/**
 * Broadcasts Client Component
 * Menampilkan broadcast dari Ops untuk Guide
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cloud, Info, Megaphone, Waves } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Broadcast = {
  id: string;
  type: 'weather_info' | 'dock_info' | 'sop_change' | 'general_announcement';
  title: string;
  message: string;
  isUrgent: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string;
  isRead: boolean;
};

type BroadcastsClientProps = {
  locale: string;
};

const BROADCAST_ICONS = {
  weather_info: Cloud,
  dock_info: Waves,
  sop_change: Info,
  general_announcement: Megaphone,
};

const BROADCAST_COLORS = {
  weather_info: 'bg-blue-500',
  dock_info: 'bg-cyan-500',
  sop_change: 'bg-purple-500',
  general_announcement: 'bg-slate-500',
};

export function BroadcastsClient({ locale: _locale }: BroadcastsClientProps) {
  const queryClient = useQueryClient();

  // Fetch broadcasts
  const { data, isLoading } = useQuery<{ broadcasts: Broadcast[] }>({
    queryKey: queryKeys.guide.broadcasts(),
    queryFn: async () => {
      const res = await fetch('/api/guide/broadcasts');
      if (!res.ok) throw new Error('Failed to load broadcasts');
      return (await res.json()) as { broadcasts: Broadcast[] };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await fetch(`/api/guide/broadcasts/${broadcastId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.broadcasts() });
    },
  });

  const handleRead = (broadcast: Broadcast) => {
    if (!broadcast.isRead) {
      markReadMutation.mutate(broadcast.id);
    }
  };

  const broadcasts = data?.broadcasts || [];

  // Group by type and sort by urgent first, then date
  const sortedBroadcasts = [...broadcasts].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-3 pb-6">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="h-20 animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedBroadcasts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Tidak ada broadcast</p>
            <p className="mt-1 text-xs text-slate-500">
              Semua informasi penting dari Ops akan muncul di sini
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedBroadcasts.map((broadcast) => {
          const Icon = BROADCAST_ICONS[broadcast.type];
          const bgColor = BROADCAST_COLORS[broadcast.type];

          return (
            <Card
              key={broadcast.id}
              className={cn(
                'border-0 shadow-sm transition-all',
                !broadcast.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30',
                broadcast.isUrgent && 'border-l-4 border-l-red-500 bg-red-50/30',
              )}
              onClick={() => handleRead(broadcast)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white', bgColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{broadcast.title}</h3>
                      {broadcast.isUrgent && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                          Urgent
                        </span>
                      )}
                      {!broadcast.isRead && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Oleh {broadcast.createdBy} •{' '}
                      {new Date(broadcast.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {broadcast.message}
                </p>
                {broadcast.expiresAt && (
                  <p className="mt-3 text-xs text-slate-500">
                    Berlaku hingga:{' '}
                    {new Date(broadcast.expiresAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
