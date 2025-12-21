'use client';

/**
 * Unified Notifications Client Component
 * Menampilkan semua notifikasi (system notifications + broadcasts) dalam satu tempat
 * Desain modern dengan UX yang lebih baik
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, Cloud, Info, Mail, Megaphone, MessageCircle, Waves } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { NotificationsAiPrioritized } from './notifications-ai-prioritized';

type NotificationsClientProps = {
  locale: string;
};

type SystemNotification = {
  id: string;
  type: 'system';
  source: 'system';
  channel: 'whatsapp' | 'email' | 'push' | 'sms';
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  readAt?: string;
  entityType?: string;
  entityId?: string;
};

type BroadcastNotification = {
  id: string;
  type: 'broadcast';
  source: 'ops';
  broadcastType: 'weather_info' | 'dock_info' | 'sop_change' | 'general_announcement';
  title: string;
  message: string;
  isUrgent: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string;
  isRead: boolean;
};

type UnifiedNotification = SystemNotification | BroadcastNotification;

type NotificationsResponse = {
  notifications: UnifiedNotification[];
  unreadCount: number;
  unreadCountByType?: {
    system: number;
    broadcast: number;
    total: number;
  };
  total: number;
  hasMore: boolean;
};

const getChannelIcon = (channel: SystemNotification['channel']) => {
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

const getChannelColor = (channel: SystemNotification['channel']) => {
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

const BROADCAST_LABELS = {
  weather_info: 'Cuaca',
  dock_info: 'Dermaga',
  sop_change: 'SOP',
  general_announcement: 'Umum',
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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  
  // Get filter from URL params (for backward compatibility with /broadcasts redirect)
  const [filter, setFilter] = useState<'all' | 'system' | 'broadcast'>(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter === 'broadcast' || urlFilter === 'system') {
      return urlFilter;
    }
    return 'all';
  });

  // Fetch unified notifications
  const { data, isLoading, error, refetch } = useQuery<NotificationsResponse>({
    queryKey: [...queryKeys.guide.notifications(), filter],
    queryFn: async () => {
      const res = await fetch(`/api/guide/notifications?type=${filter}&limit=50`);
      if (!res.ok) {
        throw new Error('Failed to load notifications');
      }
      return (await res.json()) as NotificationsResponse;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark broadcast as read mutation
  const markBroadcastReadMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const res = await fetch(`/api/guide/broadcasts/${broadcastId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.notifications() });
    },
  });

  const handleBroadcastRead = (broadcast: BroadcastNotification) => {
    if (!broadcast.isRead) {
      markBroadcastReadMutation.mutate(broadcast.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <LoadingState variant="skeleton" lines={2} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat notifikasi'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Filter notifications by type
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'system') return n.type === 'system';
    if (filter === 'broadcast') return n.type === 'broadcast';
    return true;
  });

  // Count by type
  const systemCount = notifications.filter((n) => n.type === 'system').length;
  const broadcastCount = notifications.filter((n) => n.type === 'broadcast').length;
  
  // Get unread counts by type from API response
  const unreadCounts = data?.unreadCountByType || {
    system: 0,
    broadcast: 0,
    total: data?.unreadCount || 0,
  };

  if (filteredNotifications.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filter Tabs - Modern Design */}
        <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'flex-1 font-medium transition-all',
              filter === 'all' 
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            )}
            onClick={() => setFilter('all')}
          >
            Semua
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {notifications.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'system' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'flex-1 font-medium transition-all',
              filter === 'system' 
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            )}
            onClick={() => setFilter('system')}
          >
            Sistem
            {systemCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {systemCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'broadcast' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'flex-1 font-medium transition-all',
              filter === 'broadcast' 
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            )}
            onClick={() => setFilter('broadcast')}
          >
            Pengumuman
            {broadcastCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {broadcastCount}
              </Badge>
            )}
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <EmptyState
              icon={Bell}
              title="Tidak ada notifikasi"
              description={
                filter === 'all'
                  ? 'Semua pembaruan dan pesan penting akan muncul di sini'
                  : filter === 'system'
                    ? 'Tidak ada notifikasi sistem'
                    : filter === 'broadcast'
                      ? 'Tidak ada pengumuman dari Ops'
                      : 'Tidak ada notifikasi'
              }
              variant="default"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI-Prioritized Notifications */}
      <NotificationsAiPrioritized locale={_locale} />

      {/* Filter Tabs - Modern Design */}
      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'flex-1 font-medium transition-all',
            filter === 'all' 
              ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
          )}
          onClick={() => setFilter('all')}
        >
          Semua
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
              {notifications.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === 'system' ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'flex-1 font-medium transition-all',
            filter === 'system' 
              ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
          )}
          onClick={() => setFilter('system')}
        >
          Sistem
          {systemCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
              {systemCount}
            </Badge>
          )}
        </Button>
          <Button
            variant={filter === 'broadcast' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'flex-1 font-medium transition-all',
              filter === 'broadcast' 
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
            )}
            onClick={() => setFilter('broadcast')}
          >
            Pengumuman
            {broadcastCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
                {broadcastCount}
              </Badge>
            )}
          </Button>
      </div>

      {/* Unread count badge - Enhanced */}
      {unreadCount > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {unreadCount} notifikasi belum dibaca
                </p>
                <p className="text-xs text-emerald-700/80">Ada pembaruan penting untuk Anda</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications list - Enhanced Design */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          if (notification.type === 'system') {
            const n = notification as SystemNotification;
            const Icon = getChannelIcon(n.channel);
            const iconColor = getChannelColor(n.channel);
            const isRead = n.status === 'read' || n.readAt;

            return (
              <Card
                key={n.id}
                className={cn(
                  'group border-0 shadow-sm transition-all hover:shadow-md',
                  !isRead && 'bg-gradient-to-r from-emerald-50/50 to-white ring-1 ring-emerald-200/50',
                  isRead && 'bg-white',
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Channel icon - Enhanced */}
                    <div className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105',
                      iconColor
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content - Enhanced */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {n.subject && (
                            <p className={cn(
                              'font-semibold leading-tight text-slate-900',
                              !isRead && 'font-bold'
                            )}>
                              {n.subject}
                            </p>
                          )}
                          {n.body && (
                            <p className={cn(
                              'mt-1.5 text-sm leading-relaxed',
                              isRead ? 'text-slate-600' : 'text-slate-700'
                            )}>
                              {n.body}
                            </p>
                          )}
                        </div>
                        {!isRead && (
                          <div className="flex-shrink-0">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </div>
                        )}
                      </div>

                      {/* Meta info - Enhanced */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {formatDate(n.createdAt)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-700">
                          {n.channel}
                        </span>
                        {n.entityType && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">
                            {n.entityType}
                          </span>
                        )}
                        {isRead && (
                          <span className="ml-auto flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Dibaca</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } else if (notification.type === 'broadcast') {
            const b = notification as BroadcastNotification;
            const Icon = BROADCAST_ICONS[b.broadcastType];
            const bgColor = BROADCAST_COLORS[b.broadcastType];
            const broadcastLabel = BROADCAST_LABELS[b.broadcastType];

            return (
              <Card
                key={b.id}
                className={cn(
                  'group cursor-pointer border-0 shadow-sm transition-all hover:shadow-md',
                  !b.isRead && b.isUrgent && 'bg-gradient-to-r from-red-50/50 to-white ring-2 ring-red-200/50',
                  !b.isRead && !b.isUrgent && 'bg-gradient-to-r from-blue-50/50 to-white ring-1 ring-blue-200/50',
                  b.isRead && 'bg-white',
                )}
                onClick={() => handleBroadcastRead(b)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {/* Broadcast icon - Enhanced */}
                    <div className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105',
                      bgColor
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Content - Enhanced */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold leading-tight text-slate-900">
                              {b.title}
                            </h3>
                            {b.isUrgent && (
                              <Badge variant="destructive" className="text-xs font-semibold">
                                Urgent
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {broadcastLabel}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <span>Oleh {b.createdBy}</span>
                            <span>•</span>
                            <span>{formatDate(b.createdAt)}</span>
                          </div>
                        </div>
                        {!b.isRead && (
                          <div className="flex-shrink-0">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {b.message}
                  </p>
                  {b.expiresAt && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <p className="text-xs font-medium text-amber-700">
                        Berlaku hingga:{' '}
                        {new Date(b.expiresAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {b.isRead && (
                    <div className="mt-3 flex items-center justify-end gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Sudah dibaca</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}
