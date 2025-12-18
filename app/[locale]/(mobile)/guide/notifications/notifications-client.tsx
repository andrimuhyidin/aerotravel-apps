'use client';

/**
 * Notifications Client Component
 * Menampilkan daftar notifikasi untuk guide
 */

import { Bell, CheckCircle, Clock, Mail, MessageCircle, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type NotificationsClientProps = {
  locale: string;
};

type Notification = {
  id: string;
  channel: 'whatsapp' | 'email' | 'push' | 'sms';
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  read_at?: string;
  entity_type?: string;
  entity_id?: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
};

const getChannelIcon = (channel: Notification['channel']) => {
  switch (channel) {
    case 'whatsapp':
      return MessageCircle;
    case 'email':
      return Mail;
    case 'sms':
    case 'push':
      return Bell;
    default:
      return Bell;
  }
};

const getChannelColor = (channel: Notification['channel']) => {
  switch (channel) {
    case 'whatsapp':
      return 'bg-emerald-500';
    case 'email':
      return 'bg-blue-500';
    case 'sms':
      return 'bg-slate-500';
    case 'push':
      return 'bg-orange-500';
    default:
      return 'bg-slate-500';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export function NotificationsClient({ locale: _locale }: NotificationsClientProps) {
  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.guide.notifications(),
    queryFn: async () => {
      const res = await fetch('/api/guide/notifications');
      if (!res.ok) {
        throw new Error('Failed to load notifications');
      }
      return (await res.json()) as NotificationsResponse;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-900">Gagal memuat notifikasi</p>
          <p className="mt-1 text-xs text-slate-500">Silakan coba lagi nanti</p>
        </CardContent>
      </Card>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (notifications.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <Bell className="mx-auto mb-2 h-12 w-12 text-slate-400" />
          <p className="text-sm font-medium text-slate-900">Tidak ada notifikasi</p>
          <p className="mt-1 text-xs text-slate-500">
            Semua pembaruan dan pesan penting akan muncul di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-sm font-medium text-emerald-700">
            {unreadCount} notifikasi belum dibaca
          </p>
        </div>
      )}

      {/* Notifications list */}
      {notifications.map((notification) => {
        const Icon = getChannelIcon(notification.channel);
        const iconColor = getChannelColor(notification.channel);
        const isRead = notification.status === 'read' || notification.read_at;
        const StatusIcon = isRead ? CheckCircle : Clock;

        return (
          <Card
            key={notification.id}
            className={cn(
              'border-0 shadow-sm transition-all',
              !isRead && 'bg-emerald-50/50 ring-1 ring-emerald-200/50',
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Channel icon */}
                <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', iconColor)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {notification.subject && (
                        <p className={cn('font-semibold text-slate-900', !isRead && 'font-bold')}>
                          {notification.subject}
                        </p>
                      )}
                      {notification.body && (
                        <p className={cn('mt-1 text-sm text-slate-700', isRead && 'text-slate-600')}>
                          {notification.body}
                        </p>
                      )}
                    </div>
                    <StatusIcon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isRead ? 'text-emerald-500' : 'text-amber-500',
                      )}
                    />
                  </div>

                  {/* Meta info */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(notification.created_at)}</span>
                    <span>•</span>
                    <span className="capitalize">{notification.channel}</span>
                    {notification.entity_type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{notification.entity_type}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
