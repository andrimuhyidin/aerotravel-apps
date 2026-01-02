/**
 * Inbox Client Component
 * Displays real notifications with filtering and mark as read
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Gift,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
};

type InboxClientProps = {
  locale: string;
  isLoggedIn: boolean;
};

const TAB_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'promo', label: 'Promo' },
  { key: 'trip', label: 'Trip' },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case 'promo':
      return <Tag className="h-5 w-5 text-white" />;
    case 'trip':
      return <MapPin className="h-5 w-5 text-white" />;
    case 'booking':
      return <Calendar className="h-5 w-5 text-white" />;
    case 'reward':
      return <Gift className="h-5 w-5 text-white" />;
    default:
      return <Bell className="h-5 w-5 text-white" />;
  }
}

function getNotificationIconBg(type: string) {
  switch (type) {
    case 'promo':
      return 'bg-orange-500';
    case 'trip':
      return 'bg-blue-500';
    case 'booking':
      return 'bg-green-500';
    case 'reward':
      return 'bg-purple-500';
    default:
      return 'bg-slate-500';
  }
}

export function InboxClient({ locale, isLoggedIn }: InboxClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    try {
      const typeParam = activeTab !== 'all' ? `&type=${activeTab}` : '';
      const response = await fetch(`/api/user/notifications?limit=50${typeParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      logger.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      logger.error('Failed to mark all as read', error);
      toast.error('Gagal memperbarui notifikasi');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col pb-4">
        {/* Header */}
        <div className="px-4 pb-4 pt-5">
          <h1 className="text-xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Pesan dan notifikasi Anda
          </p>
        </div>

        {/* Login Required */}
        <div className="px-4">
          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center dark:bg-slate-800">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-sm font-semibold">Login untuk Melihat</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Masuk untuk melihat pesan dan notifikasi
            </p>
            <Link
              href={`/${locale}/login`}
              className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white"
            >
              Masuk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <div>
          <h1 className="text-xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Baca Semua
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 px-4">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-muted-foreground dark:bg-slate-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                locale={locale}
                onMarkRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  locale,
  onMarkRead,
}: {
  notification: Notification;
  locale: string;
  onMarkRead: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        'flex gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors dark:bg-slate-800',
        !notification.isRead && 'border-l-4 border-primary bg-primary/5'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          getNotificationIconBg(notification.type)
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold line-clamp-1">{notification.title}</p>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: localeId,
          })}
        </p>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl}>
        {content}
      </Link>
    );
  }

  return content;
}

