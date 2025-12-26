/**
 * Partner Activity Log Client Component
 * Activity log with filters, search, and export
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';
import {
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Download,
  History,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type ActivityLog = {
  id: string;
  partnerId: string;
  userId: string;
  userName: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type ActivityLogsResponse = {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function ActivityLogClient({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [userIdFilter, setUserIdFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadActivityLogs();
  }, [actionTypeFilter, entityTypeFilter, userIdFilter, dateFrom, dateTo, searchQuery, pagination.page]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionTypeFilter !== 'all') {
        params.append('actionType', actionTypeFilter);
      }
      if (entityTypeFilter !== 'all') {
        params.append('entityType', entityTypeFilter);
      }
      if (userIdFilter !== 'all') {
        params.append('userId', userIdFilter);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/partner/activity-log?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load activity logs');
      }

      const data = (await response.json()) as ActivityLogsResponse;
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Failed to load activity logs', error);
      toast.error('Gagal memuat activity log. Silakan refresh halaman.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivityLogs();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Export all
      });

      if (actionTypeFilter !== 'all') {
        params.append('actionType', actionTypeFilter);
      }
      if (entityTypeFilter !== 'all') {
        params.append('entityType', entityTypeFilter);
      }
      if (userIdFilter !== 'all') {
        params.append('userId', userIdFilter);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/partner/activity-log?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export activity logs');
      }

      const data = (await response.json()) as ActivityLogsResponse;

      // Generate CSV
      const csvData = [
        ['Tanggal', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'],
        ...data.logs.map((log) => [
          new Date(log.createdAt).toLocaleString('id-ID'),
          log.userName,
          log.actionType,
          log.entityType,
          log.entityId || '',
          JSON.stringify(log.details),
          log.ipAddress || '',
        ]),
      ];

      const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Activity log berhasil diekspor ke CSV');
    } catch (error) {
      logger.error('Failed to export activity logs', error);
      toast.error('Gagal mengekspor activity log');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionTypeLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      booking_created: 'Booking Dibuat',
      booking_updated: 'Booking Diupdate',
      booking_cancelled: 'Booking Dibatalkan',
      invoice_generated: 'Invoice Dibuat',
      customer_created: 'Customer Dibuat',
      customer_updated: 'Customer Diupdate',
      settings_changed: 'Pengaturan Diubah',
      package_created: 'Paket Dibuat',
      package_updated: 'Paket Diupdate',
    };
    return labels[actionType] || actionType;
  };

  const getEntityTypeLabel = (entityType: string): string => {
    const labels: Record<string, string> = {
      booking: 'Booking',
      invoice: 'Invoice',
      customer: 'Customer',
      package: 'Paket',
      settings: 'Pengaturan',
    };
    return labels[entityType] || entityType;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6 py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Activity Log</h1>
          <p className="text-muted-foreground">
            Audit trail aktivitas tim Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="booking_created">Booking Dibuat</SelectItem>
                  <SelectItem value="booking_updated">Booking Diupdate</SelectItem>
                  <SelectItem value="invoice_generated">Invoice Dibuat</SelectItem>
                  <SelectItem value="customer_created">Customer Dibuat</SelectItem>
                  <SelectItem value="settings_changed">Pengaturan Diubah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="package">Paket</SelectItem>
                  <SelectItem value="settings">Pengaturan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {/* TODO: Load team members dynamically */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari di details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      {logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak ada activity log"
          description="Belum ada aktivitas yang tercatat."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Total: {pagination.total} aktivitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Tanggal</th>
                    <th className="text-left p-3 text-sm font-medium">User</th>
                    <th className="text-left p-3 text-sm font-medium">Action</th>
                    <th className="text-left p-3 text-sm font-medium">Entity</th>
                    <th className="text-left p-3 text-sm font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="text-sm">{formatDate(log.createdAt)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{log.userName}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{getActionTypeLabel(log.actionType)}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <Badge variant="secondary">{getEntityTypeLabel(log.entityType)}</Badge>
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {log.entityId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm max-w-md truncate">
                          {Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details)
                            : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

