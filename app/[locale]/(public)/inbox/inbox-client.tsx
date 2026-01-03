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
  CheckCheck,
  Gift,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  Sparkles,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { AerobotWidget } from '@/components/public/aerobot-widget';
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
  { key: 'aerobot', label: 'AeroBot', icon: Sparkles },
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
      return 'bg-warning';
    case 'trip':
      return 'bg-info';
    case 'booking':
      return 'bg-success';
    case 'reward':
      return 'bg-primary';
    default:
      return 'bg-muted';
  }
}

export function InboxClient({ locale, isLoggedIn }: InboxClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // Default to 'aerobot' for non-logged-in users, 'all' for logged-in users
  const [activeTab, setActiveTab] = useState(isLoggedIn ? 'all' : 'aerobot');
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

  // Handle tab click for non-logged-in users
  const handleTabClick = (tabKey: string) => {
    // Always allow tab switching, but show login prompt for non-logged-in users on non-AeroBot tabs
    setActiveTab(tabKey);
  };

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <div>
          <h1 className="text-xl font-bold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'aerobot'
              ? 'Chat dengan AeroBot'
              : !isLoggedIn
                ? 'Login untuk melihat notifikasi'
                : unreadCount > 0
                  ? `${unreadCount} belum dibaca`
                  : 'Semua sudah dibaca'}
          </p>
        </div>
        {isLoggedIn && unreadCount > 0 && activeTab !== 'aerobot' && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Baca Semua
          </Button>
        )}
      </div>

      {/* Tabs - Show all tabs for everyone */}
      <div className="mb-4 flex gap-2 px-4">
        {TAB_FILTERS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const requiresLogin = !isLoggedIn && tab.key !== 'aerobot';
          
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                'flex items-center justify-center gap-1.5 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : requiresLogin
                    ? 'bg-muted text-muted-foreground/70'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'aerobot' ? (
        <div className="px-4">
          <AerobotWidget embedded />
        </div>
      ) : !isLoggedIn ? (
        // Show login prompt for non-logged-in users trying to access notifications
        <div className="px-4">
          <div className="flex flex-col items-center rounded-2xl bg-white p-8 text-center dark:bg-background">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-muted">
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
      ) : (
        <>
          {/* Notifications List */}
          <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-white p-8 text-center dark:border-muted-foreground/20 dark:bg-background">
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
        </>
      )}
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
        'flex gap-3 rounded-2xl bg-white p-4 shadow-sm transition-colors dark:bg-background',
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
        <p className="mt-1 text-xs text-muted-foreground">
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

