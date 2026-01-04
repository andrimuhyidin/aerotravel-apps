/**
 * Notifications Dropdown Component
 * Display recent notifications and alerts
 */

'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  link?: string;
};

type NotificationsDropdownProps = {
  notifications?: Notification[];
  unreadCount?: number;
  locale?: string;
};

export function NotificationsDropdown({
  notifications = [],
  unreadCount = 0,
  locale = 'id',
}: NotificationsDropdownProps) {
  // Sample notifications - in production, fetch from API
  const sampleNotifications: Notification[] = notifications.length > 0
    ? notifications
    : [
        {
          id: '1',
          title: 'New booking received',
          description: 'Booking BK-2026-001 for Pahawang package',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/console/bookings',
        },
        {
          id: '2',
          title: 'Payment confirmed',
          description: 'Payment of Rp 2.500.000 has been confirmed',
          type: 'success',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false,
          link: '/console/finance',
        },
        {
          id: '3',
          title: 'SOS Alert',
          description: 'Emergency alert from Guide Budi',
          type: 'error',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: true,
          link: '/console/safety',
        },
      ];

  const unreadNotifications = sampleNotifications.filter((n) => !n.read);
  const displayCount = unreadCount > 0 ? unreadCount : unreadNotifications.length;

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayCount > 9 ? '9+' : displayCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {displayCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {displayCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {sampleNotifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="space-y-1">
              {sampleNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start p-3 cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getTypeColor(notification.type))}
                        >
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center cursor-pointer" asChild>
          <Link href={`/${locale}/console/notifications`}>
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

