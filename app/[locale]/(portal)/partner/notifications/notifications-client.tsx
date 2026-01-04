/**
 * Partner Notifications Client Component
 * Using Unified Notifications API
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  DollarSign,
  Package,
  Info,
  AlertTriangle,
  Users,
  Wallet,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

type GroupedNotifications = {
  today: UnifiedNotification[];
  yesterday: UnifiedNotification[];
  older: UnifiedNotification[];
};

export function NotificationsClient({ locale }: { locale: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch notifications using unified API
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.list({ app: 'partner' }),
    queryFn: async () => {
      const response = await apiClient.get<NotificationsResponse>(
        '/api/notifications?app=partner&limit=100'
      );
      return response.data;
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/notifications/read-all', { app: 'partner' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      toast.success('Semua notifikasi ditandai sudah dibaca');
    },
    onError: () => {
      toast.error('Gagal menandai notifikasi');
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Notifikasi"
        description="Update dan informasi terbaru"
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Semua ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Belum Dibaca ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Sudah Dibaca ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          {['all', 'unread', 'read'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {isLoading ? (
                <NotificationsSkeleton />
              ) : filteredNotifications.length === 0 ? (
                <EmptyState
                  variant="minimal"
                  icon={Bell}
                  title={
                    tab === 'unread'
                      ? 'Semua sudah dibaca'
                      : 'Belum ada notifikasi'
                  }
                  description={
                    tab === 'unread'
                      ? 'Anda sudah membaca semua notifikasi'
                      : 'Notifikasi Anda akan muncul di sini'
                  }
                />
              ) : (
                <>
                  {/* Today */}
                  {groupedNotifications.today.length > 0 && (
                    <NotificationGroup
                      title="Hari Ini"
                      notifications={groupedNotifications.today}
                      onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                      locale={locale}
                    />
                  )}

                  {/* Yesterday */}
                  {groupedNotifications.yesterday.length > 0 && (
                    <NotificationGroup
                      title="Kemarin"
                      notifications={groupedNotifications.yesterday}
                      onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                      locale={locale}
                    />
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <NotificationGroup
                      title="Lebih Lama"
                      notifications={groupedNotifications.older}
                      onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                      locale={locale}
                    />
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// Notification Group Component
function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
  locale,
}: {
  title: string;
  notifications: UnifiedNotification[];
  onMarkAsRead: (id: string) => void;
  locale: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {notifications.map((notif) => (
        <NotificationCard
          key={notif.id}
          notification={notif}
          onMarkAsRead={onMarkAsRead}
          locale={locale}
        />
      ))}
    </div>
  );
}

// Notification Card Component
function NotificationCard({
  notification,
  onMarkAsRead,
  locale,
}: {
  notification: UnifiedNotification;
  onMarkAsRead: (id: string) => void;
  locale: string;
}) {
  const getIcon = (type: NotificationType) => {
    if (type.startsWith('booking.')) return Calendar;
    if (type.startsWith('payment.')) return DollarSign;
    if (type.startsWith('wallet.')) return Wallet;
    if (type.startsWith('trip.')) return Truck;
    if (type.startsWith('package.')) return Package;
    if (type.startsWith('refund.')) return AlertTriangle;
    if (type.startsWith('support.')) return Users;
    if (type.startsWith('system.')) return Info;
    return Bell;
  };

  const getIconColor = (type: NotificationType) => {
    if (type.startsWith('booking.')) return 'bg-blue-100 text-blue-600';
    if (type.startsWith('payment.')) return 'bg-green-100 text-green-600';
    if (type.startsWith('wallet.')) return 'bg-emerald-100 text-emerald-600';
    if (type.startsWith('trip.')) return 'bg-indigo-100 text-indigo-600';
    if (type.startsWith('package.')) return 'bg-purple-100 text-purple-600';
    if (type.startsWith('refund.')) return 'bg-orange-100 text-orange-600';
    if (type.startsWith('support.')) return 'bg-yellow-100 text-yellow-600';
    if (type.startsWith('system.')) return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-600';
  };

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
          <div className="flex flex-col gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
