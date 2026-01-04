/**
 * Notifications Center Client Component
 * Using Unified Notifications API
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertTriangle,
  Truck,
  Package,
  Users,
  Info,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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

type NotificationsCenterClientProps = {
  locale: string;
  userId: string;
};

type FilterType = 'all' | 'unread' | 'read';
type NotificationCategory = 'all' | 'booking' | 'payment' | 'trip' | 'wallet' | 'system';

export function NotificationsCenterClient({
  locale,
  userId,
}: NotificationsCenterClientProps) {
  const queryClient = useQueryClient();
  const [filterRead, setFilterRead] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory>('all');

  // Fetch notifications from unified API
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.list({ app: 'admin' }),
    queryFn: async () => {
      const response = await apiClient.get<NotificationsResponse>(
        '/api/notifications?app=admin&limit=100'
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
      toast.success('Marked as read');
    },
    onError: () => {
      toast.error('Failed to mark as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/notifications/read-all', { app: 'admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  // Get category from notification type
  const getCategory = (type: NotificationType): NotificationCategory => {
    if (type.startsWith('booking.')) return 'booking';
    if (type.startsWith('payment.')) return 'payment';
    if (type.startsWith('trip.')) return 'trip';
    if (type.startsWith('wallet.')) return 'wallet';
    if (type.startsWith('system.')) return 'system';
    return 'system';
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    if (filterCategory !== 'all' && getCategory(n.type) !== filterCategory) return false;
    return true;
  });

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

  const getTypeColor = (type: NotificationType) => {
    if (type.startsWith('booking.')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (type.startsWith('payment.')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (type.startsWith('wallet.')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (type.startsWith('trip.')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (type.startsWith('refund.') || type.includes('error') || type.includes('failed')) 
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (type.startsWith('system.maintenance')) 
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('id-ID');
  };

  const getCategoryLabel = (type: NotificationType): string => {
    const parts = type.split('.');
    return parts[0] || 'system';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRead} onValueChange={(v) => setFilterRead(v as FilterType)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as NotificationCategory)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="trip">Trip</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type.startsWith('booking.')).length}
                </p>
                <p className="text-sm text-muted-foreground">Booking</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type.startsWith('payment.')).length}
                </p>
                <p className="text-sm text-muted-foreground">Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                      getTypeColor(notification.type)
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-xs capitalize', getTypeColor(notification.type))}
                        >
                          {getCategoryLabel(notification.type)}
                        </Badge>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
