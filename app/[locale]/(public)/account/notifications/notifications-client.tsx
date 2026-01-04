/**
 * Customer Notifications Client Component
 * Using Unified Notifications API
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertTriangle,
  Package,
  Info,
  Ship,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

import type { UnifiedNotification, NotificationType } from '@/lib/notifications/notification-types';

type NotificationsResponse = {
  notifications: UnifiedNotification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  unreadCount: number;
};

type CustomerNotificationsClientProps = {
  locale: string;
};

type GroupedNotifications = {
  today: UnifiedNotification[];
  yesterday: UnifiedNotification[];
  older: UnifiedNotification[];
};

export function CustomerNotificationsClient({ locale }: CustomerNotificationsClientProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch notifications from unified API
  const { data, isLoading, refetch, isRefetching } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.list({ app: 'customer' }),
    queryFn: async () => {
      const response = await apiClient.get<NotificationsResponse>(
        '/api/notifications?app=customer&limit=100'
      );
      return response.data;
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/notifications/read-all', { app: 'customer' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      toast.success('Semua notifikasi ditandai sudah dibaca');
    },
    onError: () => {
      toast.error('Gagal menandai semua');
    },
  });

  // Filter notifications
  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.read);

  // Group by date
  const groupedNotifications: GroupedNotifications = {
    today: [],
    yesterday: [],
    older: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  filteredNotifications.forEach((notif) => {
    const notifDate = new Date(notif.created_at);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      groupedNotifications.today.push(notif);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      groupedNotifications.yesterday.push(notif);
    } else {
      groupedNotifications.older.push(notif);
    }
  });

  const getIcon = (type: NotificationType) => {
    if (type.startsWith('booking.')) return Calendar;
    if (type.startsWith('payment.')) return DollarSign;
    if (type.startsWith('trip.')) return Ship;
    if (type.startsWith('package.')) return Package;
    if (type.startsWith('refund.')) return AlertTriangle;
    if (type.includes('promo') || type.includes('voucher')) return Gift;
    if (type.startsWith('system.')) return Info;
    return Bell;
  };

  const getIconColor = (type: NotificationType) => {
    if (type.startsWith('booking.')) return 'bg-blue-100 text-blue-600';
    if (type.startsWith('payment.')) return 'bg-green-100 text-green-600';
    if (type.startsWith('trip.')) return 'bg-indigo-100 text-indigo-600';
    if (type.startsWith('package.')) return 'bg-purple-100 text-purple-600';
    if (type.startsWith('refund.')) return 'bg-orange-100 text-orange-600';
    if (type.includes('promo') || type.includes('voucher')) return 'bg-pink-100 text-pink-600';
    if (type.startsWith('system.')) return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-600';
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            Update status booking dan promo terbaru
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('h-5 w-5', isRefetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">
            Semua ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Baru ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Dibaca ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        {['all', 'unread', 'read'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">
                  {tab === 'unread'
                    ? 'Semua notifikasi sudah dibaca'
                    : 'Belum ada notifikasi'}
                </p>
                <p className="text-sm mt-1">
                  {tab === 'unread'
                    ? 'Anda sudah membaca semua notifikasi'
                    : 'Notifikasi booking dan promo akan muncul di sini'}
                </p>
              </div>
            ) : (
              <>
                {/* Today */}
                {groupedNotifications.today.length > 0 && (
                  <NotificationGroup
                    title="Hari Ini"
                    notifications={groupedNotifications.today}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                    getIcon={getIcon}
                    getIconColor={getIconColor}
                  />
                )}

                {/* Yesterday */}
                {groupedNotifications.yesterday.length > 0 && (
                  <NotificationGroup
                    title="Kemarin"
                    notifications={groupedNotifications.yesterday}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                    getIcon={getIcon}
                    getIconColor={getIconColor}
                  />
                )}

                {/* Older */}
                {groupedNotifications.older.length > 0 && (
                  <NotificationGroup
                    title="Sebelumnya"
                    notifications={groupedNotifications.older}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                    getIcon={getIcon}
                    getIconColor={getIconColor}
                  />
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Notification Group Component
function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
  getIcon,
  getIconColor,
}: {
  title: string;
  notifications: UnifiedNotification[];
  onMarkAsRead: (id: string) => void;
  getIcon: (type: NotificationType) => React.ComponentType<{ className?: string }>;
  getIconColor: (type: NotificationType) => string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">{title}</h3>
      {notifications.map((notif) => (
        <NotificationCard
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          getIcon={getIcon}
          getIconColor={getIconColor}
        />
      ))}
    </div>
  );
}

// Notification Card Component
function NotificationCard({
  notification,
  onMarkAsRead,
  getIcon,
  getIconColor,
}: {
  notification: UnifiedNotification;
  onMarkAsRead: (id: string) => void;
  getIcon: (type: NotificationType) => React.ComponentType<{ className?: string }>;
  getIconColor: (type: NotificationType) => string;
}) {
  const Icon = getIcon(notification.type);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        !notification.read && 'border-l-4 border-l-primary bg-blue-50/30'
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              getIconColor(notification.type)
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Actions */}
          {!notification.read && (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

