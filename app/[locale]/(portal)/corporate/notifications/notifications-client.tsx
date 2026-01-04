/**
 * Corporate Notifications Client Component
 * Using Unified Notifications API
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  Info,
  FileCheck,
  Building2,
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

type CorporateNotificationsClientProps = {
  locale: string;
};

type FilterType = 'all' | 'unread' | 'read';

export function CorporateNotificationsClient({ locale }: CorporateNotificationsClientProps) {
  const queryClient = useQueryClient();
  const [filterRead, setFilterRead] = useState<FilterType>('all');

  // Fetch notifications from unified API
  const { data, isLoading, refetch, isRefetching } = useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.list({ app: 'corporate' }),
    queryFn: async () => {
      const response = await apiClient.get<NotificationsResponse>(
        '/api/notifications?app=corporate&limit=100'
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
      toast.success('Ditandai sudah dibaca');
    },
    onError: () => {
      toast.error('Gagal menandai');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/notifications/read-all', { app: 'corporate' });
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
  const filteredNotifications = notifications.filter((n) => {
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

  const getIcon = (type: NotificationType) => {
    if (type.startsWith('booking.')) return Calendar;
    if (type.startsWith('payment.')) return DollarSign;
    if (type.startsWith('wallet.')) return Wallet;
    if (type.startsWith('corporate.approval')) return FileCheck;
    if (type.startsWith('corporate.budget')) return Building2;
    if (type.startsWith('corporate.employee')) return Users;
    if (type.startsWith('refund.')) return AlertTriangle;
    if (type.startsWith('system.')) return Info;
    return Bell;
  };

  const getTypeColor = (type: NotificationType) => {
    if (type.startsWith('booking.')) return 'bg-blue-100 text-blue-800';
    if (type.startsWith('payment.')) return 'bg-green-100 text-green-800';
    if (type.startsWith('wallet.')) return 'bg-emerald-100 text-emerald-800';
    if (type.includes('approved')) return 'bg-green-100 text-green-800';
    if (type.includes('rejected')) return 'bg-red-100 text-red-800';
    if (type.includes('pending') || type.includes('requested')) return 'bg-yellow-100 text-yellow-800';
    if (type.startsWith('corporate.')) return 'bg-purple-100 text-purple-800';
    if (type.startsWith('refund.')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const getCategoryLabel = (type: NotificationType): string => {
    if (type.startsWith('corporate.approval')) return 'Approval';
    if (type.startsWith('corporate.budget')) return 'Budget';
    if (type.startsWith('corporate.employee')) return 'Karyawan';
    if (type.startsWith('corporate.booking')) return 'Booking';
    if (type.startsWith('booking.')) return 'Booking';
    if (type.startsWith('payment.')) return 'Pembayaran';
    if (type.startsWith('system.')) return 'Sistem';
    return 'Lainnya';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">
            Update dan informasi terbaru untuk akun corporate Anda
          </p>
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
              Tandai Semua Dibaca
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterRead} onValueChange={(v) => setFilterRead(v as FilterType)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua ({notifications.length})</SelectItem>
            <SelectItem value="unread">Belum Dibaca ({unreadCount})</SelectItem>
            <SelectItem value="read">Sudah Dibaca ({notifications.length - unreadCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Belum Dibaca</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type.startsWith('corporate.approval')).length}
                </p>
                <p className="text-sm text-muted-foreground">Approval</p>
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
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Notifikasi</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada notifikasi</p>
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
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                        getTypeColor(notification.type)
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getTypeColor(notification.type))}
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

