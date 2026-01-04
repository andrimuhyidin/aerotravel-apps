'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Clock, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';

type ScheduledNotification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  delivery_method: string;
  schedule_time: string;
  repeat_pattern: string | null;
  status: string;
  run_count: number;
  next_run_at: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  reminder: 'Reminder',
  follow_up: 'Follow Up',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  custom: 'Custom',
};

const deliveryLabels: Record<string, string> = {
  in_app: 'In-App',
  email: 'Email',
  push: 'Push',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

type ScheduledNotificationsClientProps = {
  locale: string;
};

export function ScheduledNotificationsClient({ locale: _locale }: ScheduledNotificationsClientProps) {
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'scheduled-notifications', status],
    queryFn: async () => {
      const params = new URLSearchParams({ status });
      const response = await fetch(`/api/admin/notifications/scheduled?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' | 'cancel' }) => {
      const response = await fetch(`/api/admin/notifications/scheduled/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to update notification');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Notification updated');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'scheduled-notifications'] });
    },
    onError: () => toast.error('Failed to update notification'),
  });

  const columns: DataTableColumn<ScheduledNotification>[] = [
    {
      key: 'type',
      header: 'Type',
      accessor: (row) => (
        <Badge variant="outline">{typeLabels[row.notification_type] || row.notification_type}</Badge>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      accessor: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{row.message}</p>
        </div>
      ),
    },
    {
      key: 'delivery',
      header: 'Delivery',
      accessor: (row) => deliveryLabels[row.delivery_method] || row.delivery_method,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      accessor: (row) => (
        <div className="text-sm">
          <p>{new Date(row.schedule_time).toLocaleString('id-ID')}</p>
          {row.repeat_pattern && (
            <p className="text-xs text-muted-foreground capitalize">{row.repeat_pattern}</p>
          )}
        </div>
      ),
    },
    {
      key: 'next_run',
      header: 'Next Run',
      accessor: (row) => row.next_run_at ? new Date(row.next_run_at).toLocaleString('id-ID') : '-',
    },
    {
      key: 'runs',
      header: 'Runs',
      accessor: (row) => row.run_count,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge className={statusColors[row.status] || 'bg-gray-100 text-gray-800'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-1">
          {row.status === 'active' && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => toggleMutation.mutate({ id: row.id, action: 'pause' })}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {row.status === 'paused' && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => toggleMutation.mutate({ id: row.id, action: 'resume' })}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {['pending', 'active', 'paused'].includes(row.status) && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-600"
              onClick={() => toggleMutation.mutate({ id: row.id, action: 'cancel' })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load scheduled notifications</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { total: 0, active: 0, pending: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduled Notifications</h1>
          <p className="text-muted-foreground">Manage automated notification schedules</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule New
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Notifications</CardTitle>
          <CardDescription>
            {data?.notifications?.length || 0} notifications found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.notifications || []}
            emptyMessage="No scheduled notifications"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

