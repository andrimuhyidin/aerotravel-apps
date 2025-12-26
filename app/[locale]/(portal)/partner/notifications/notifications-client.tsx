/**
 * Partner Notifications Client Component
 * REDESIGNED - Grouped by date, Clean cards, Mark as read
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/partner';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Notification = {
  id: string;
  type: 'booking' | 'payment' | 'system' | 'promo';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string | null;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

type GroupedNotifications = {
  today: Notification[];
  yesterday: Notification[];
  older: Notification[];
};

export function NotificationsClient({ locale }: { locale: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      logger.error('Failed to load notifications', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/partner/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to mark all as read');

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      logger.error('Failed to mark all as read', error);
      toast.error('Gagal menandai notifikasi');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/partner/notifications/${id}/read`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to mark as read');

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark as read', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/partner/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete notification');

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      logger.error('Failed to delete notification', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  // Filter notifications
  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.isRead);

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
    const notifDate = new Date(notif.createdAt);
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
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
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
              {loading ? (
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
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      locale={locale}
                    />
                  )}

                  {/* Yesterday */}
                  {groupedNotifications.yesterday.length > 0 && (
                    <NotificationGroup
                      title="Kemarin"
                      notifications={groupedNotifications.yesterday}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      locale={locale}
                    />
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <NotificationGroup
                      title="Lebih Lama"
                      notifications={groupedNotifications.older}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
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
  onDelete,
  locale,
}: {
  title: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
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
          onDelete={onDelete}
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
  onDelete,
  locale,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  locale: string;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'booking':
        return Calendar;
      case 'payment':
        return DollarSign;
      case 'promo':
        return Package;
      case 'system':
        return Info;
      default:
        return Bell;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'booking':
        return 'bg-blue-100 text-blue-600';
      case 'payment':
        return 'bg-green-100 text-green-600';
      case 'promo':
        return 'bg-purple-100 text-purple-600';
      case 'system':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const Icon = getIcon();

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        !notification.isRead && 'border-l-4 border-l-primary bg-blue-50/30'
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              getIconColor()
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
              {!notification.isRead && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(notification.createdAt).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-600"
              onClick={() => onDelete(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
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
