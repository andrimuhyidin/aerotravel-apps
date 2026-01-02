/**
 * Audit Log Client Component
 * Activity log viewer with filters and data masking log
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileEdit,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type AuditLog = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type AuditLogResponse = {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    actions: string[];
    resources: string[];
  };
};

async function fetchAuditLogs(params: {
  action: string;
  resource: string;
  startDate: string;
  endDate: string;
  page: number;
}): Promise<AuditLogResponse> {
  const urlParams = new URLSearchParams({
    action: params.action,
    resource: params.resource,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page.toString(),
    limit: '50',
  });
  const response = await fetch(`/api/admin/audit-log?${urlParams}`);
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogClient() {
  const [action, setAction] = useState('all');
  const [resource, setResource] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'audit-log', action, resource, startDate, endDate, page],
    queryFn: () => fetchAuditLogs({ action, resource, startDate, endDate, page }),
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat audit log');
    }
  }, [error]);

  const handleExport = () => {
    toast.info('Export akan segera tersedia');
  };

  if (isLoading) {
    return <AuditLogSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Riwayat aktivitas dan perubahan data sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="unmask">Unmask</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Select value={resource} onValueChange={(v) => { setResource(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} aktivitas ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
            {(!data?.logs || data.logs.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada log ditemukan
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {data.pagination.page} dari {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components

function LogEntry({ log }: { log: AuditLog }) {
  const [isOpen, setIsOpen] = useState(false);

  const actionIcons = {
    create: Plus,
    update: FileEdit,
    delete: Trash2,
    view: Eye,
    unmask: Shield,
  };
  const Icon = actionIcons[log.action as keyof typeof actionIcons] || FileEdit;

  const actionColors = {
    create: 'text-green-600 bg-green-100',
    update: 'text-blue-600 bg-blue-100',
    delete: 'text-red-600 bg-red-100',
    view: 'text-gray-600 bg-gray-100',
    unmask: 'text-purple-600 bg-purple-100',
  };
  const actionColor = actionColors[log.action as keyof typeof actionColors] || 'text-gray-600 bg-gray-100';

  const actionLabels: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    view: 'Viewed',
    unmask: 'Unmasked',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50">
            <div className={cn('rounded-lg p-2', actionColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-xs">
                  {log.action}
                </Badge>
                <span className="text-sm font-medium">
                  {actionLabels[log.action] || log.action} {log.resourceType}
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  {log.resourceId}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{log.user.name}</span>
                <span>•</span>
                <span>{formatRelativeTime(log.createdAt)}</span>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4 bg-muted/30 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">User</p>
                <p className="text-sm">{log.user.name}</p>
                <p className="text-xs text-muted-foreground">{log.user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Timestamp</p>
                <p className="text-sm">
                  {new Date(log.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">IP Address</p>
                <p className="text-sm font-mono">{log.ipAddress}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Resource</p>
                <p className="text-sm">
                  {log.resourceType} / <span className="font-mono">{log.resourceId}</span>
                </p>
              </div>
            </div>
            {(log.oldData || log.newData) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {log.oldData && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Old Data</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(log.oldData, null, 2)}
                    </pre>
                  </div>
                )}
                {log.newData && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">New Data</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(log.newData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function AuditLogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

