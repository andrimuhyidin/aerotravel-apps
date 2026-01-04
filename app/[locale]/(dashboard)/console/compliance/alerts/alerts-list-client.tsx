/**
 * Compliance Alerts List Client Component
 * DataTable with search, filters, and actions
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Alert = {
  id: string;
  licenseId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  readAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  notificationsSent: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  createdAt: string;
  license: {
    id: string;
    type: string;
    number: string;
    name: string;
    status: string;
  } | null;
  readBy: string | null;
  resolvedBy: string | null;
};

type AlertsResponse = {
  alerts: Alert[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchAlerts(
  isRead: string,
  isResolved: string,
  severity: string,
  page: number
): Promise<AlertsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });
  if (isRead !== 'all') params.append('isRead', isRead);
  if (isResolved !== 'all') params.append('isResolved', isResolved);
  if (severity !== 'all') params.append('severity', severity);

  const response = await fetch(`/api/admin/compliance/alerts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
}

async function updateAlert(
  alertId: string,
  action: 'read' | 'resolve',
  resolutionNotes?: string
): Promise<void> {
  const response = await fetch(`/api/admin/compliance/alerts/${alertId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      resolutionNotes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update alert');
  }
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const severityIcons: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const alertTypeLabels: Record<string, string> = {
  expiry_30d: 'Expires in 30 days',
  expiry_15d: 'Expires in 15 days',
  expiry_7d: 'Expires in 7 days',
  expiry_1d: 'Expires tomorrow',
  expired: 'Expired',
  renewal_reminder: 'Renewal reminder',
  status_change: 'Status changed',
};

type AlertsListClientProps = {
  locale: string;
};

function AlertsListSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AlertsListClient({ locale }: AlertsListClientProps) {
  const [isRead, setIsRead] = useState('all');
  const [isResolved, setIsResolved] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'compliance-alerts', isRead, isResolved, severity, page],
    queryFn: () => fetchAlerts(isRead, isResolved, severity, page),
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: string) => updateAlert(alertId, 'read'),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, 'compliance-alerts'],
      });
      toast.success('Alert ditandai dibaca');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui alert');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ alertId, notes }: { alertId: string; notes?: string }) =>
      updateAlert(alertId, 'resolve', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.all, 'compliance-alerts'],
      });
      toast.success('Alert diselesaikan');
      setResolveDialogOpen(false);
      setResolutionNotes('');
      setSelectedAlert(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyelesaikan alert');
    },
  });

  const handleMarkRead = (alert: Alert) => {
    if (alert.isRead) {
      toast.info('Alert sudah ditandai dibaca');
      return;
    }
    markReadMutation.mutate(alert.id);
  };

  const handleResolve = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = () => {
    if (!selectedAlert) return;
    resolveMutation.mutate({
      alertId: selectedAlert.id,
      notes: resolutionNotes || undefined,
    });
  };

  if (isLoading) {
    return <AlertsListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading alerts</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const alerts = data?.alerts || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const unreadCount = data?.unreadCount || 0;

  const columns: DataTableColumn<Alert>[] = [
    {
      key: 'severity',
      header: 'Severity',
      accessor: (alert) => {
        const SeverityIcon = severityIcons[alert.severity] || Info;
        return (
          <div className="flex items-center gap-2">
            <SeverityIcon
              className={cn(
                'h-5 w-5',
                alert.severity === 'critical' && 'text-red-600',
                alert.severity === 'warning' && 'text-yellow-600',
                alert.severity === 'info' && 'text-blue-600'
              )}
            />
            <Badge
              variant="outline"
              className={cn(
                'font-medium',
                severityColors[alert.severity] || severityColors.info
              )}
            >
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'alert',
      header: 'Alert',
      accessor: (alert) => (
        <div>
          <div className="font-medium">
            {alertTypeLabels[alert.alertType] || alert.alertType}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
          {alert.license && (
            <div className="text-xs text-muted-foreground mt-1">
              License: {alert.license.name} ({alert.license.number})
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (alert) => (
        <div className="flex flex-col gap-1">
          {alert.isRead ? (
            <Badge variant="outline" className="w-fit">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Read
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-fit">
              <XCircle className="mr-1 h-3 w-3" />
              Unread
            </Badge>
          )}
          {alert.isResolved && (
            <Badge variant="default" className="w-fit">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Resolved
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (alert) => (
        <span className="text-sm text-muted-foreground">
          {new Date(alert.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (alert) => (
        <div className="flex items-center gap-2">
          {alert.license && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/console/compliance/licenses/${alert.license.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {!alert.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkRead(alert)}
              disabled={markReadMutation.isPending}
            >
              Mark Read
            </Button>
          )}
          {!alert.isResolved && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleResolve(alert)}
              disabled={resolveMutation.isPending}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Alerts</h1>
          <p className="text-muted-foreground">
            Manage license expiry alerts and compliance notifications
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} unread
            </Badge>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                {pagination.total} alerts found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={isRead}
              onValueChange={(value) => {
                setIsRead(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Unread</SelectItem>
                <SelectItem value="true">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={isResolved}
              onValueChange={(value) => {
                setIsResolved(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Resolved Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Unresolved</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={severity}
              onValueChange={(value) => {
                setSeverity(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={alerts}
            loading={isRefetching}
            emptyMessage="No alerts found"
            emptyDescription="Try adjusting your filters"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add resolution notes for this alert (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-medium">{selectedAlert.message}</p>
                {selectedAlert.license && (
                  <p className="text-xs text-muted-foreground mt-1">
                    License: {selectedAlert.license.name}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter resolution notes..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setResolutionNotes('');
                setSelectedAlert(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

