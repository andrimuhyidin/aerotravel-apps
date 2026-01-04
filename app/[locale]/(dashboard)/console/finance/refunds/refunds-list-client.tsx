'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Download, Check, X, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
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
import { ReportExporter, downloadFile } from '@/lib/excel/export';

type Refund = {
  id: string;
  booking_id: string;
  booking_code: string;
  refund_amount: number;
  original_amount: number;
  refund_percentage: number;
  refund_reason: string;
  refund_status: string;
  refund_method: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
};

type RefundsListClientProps = {
  locale: string;
};

export function RefundsListClient({ locale }: RefundsListClientProps) {
  const [status, setStatus] = useState('pending');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.finance.refunds.list({ status }),
    queryFn: async () => {
      const params = new URLSearchParams({ status });
      const response = await fetch(`/api/admin/finance/refunds?${params}`);
      if (!response.ok) throw new Error('Failed to fetch refunds');
      return response.json();
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' | 'complete' }) => {
      const response = await fetch(`/api/admin/finance/refunds/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to process refund');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.finance.refunds.all() });
    },
    onError: () => toast.error('Failed to process refund'),
  });

  const handleExport = async () => {
    if (!data?.refunds?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.refunds(data.refunds);
      downloadFile(buffer, `refunds-${status}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const columns: DataTableColumn<Refund>[] = [
    {
      key: 'booking',
      header: 'Booking',
      accessor: (row) => (
        <Link href={`/${locale}/console/bookings/${row.booking_id}`} className="font-mono text-blue-600 hover:underline">
          {row.booking_code}
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Refund Amount',
      accessor: (row) => (
        <div>
          <p className="font-medium">{formatCurrency(row.refund_amount)}</p>
          <p className="text-xs text-muted-foreground">{row.refund_percentage}% of {formatCurrency(row.original_amount)}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (row) => <span className="text-sm max-w-[200px] truncate block">{row.refund_reason}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      accessor: (row) => row.refund_method || '-',
    },
    {
      key: 'date',
      header: 'Requested',
      accessor: (row) => new Date(row.created_at).toLocaleDateString('id-ID'),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge className={statusColors[row.refund_status] || 'bg-gray-100 text-gray-800'}>
          {row.refund_status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => {
        if (row.refund_status === 'pending') {
          return (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-green-600"
                onClick={() => processMutation.mutate({ id: row.id, action: 'approve' })}
                disabled={processMutation.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600"
                onClick={() => processMutation.mutate({ id: row.id, action: 'reject' })}
                disabled={processMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        if (row.refund_status === 'approved') {
          return (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => processMutation.mutate({ id: row.id, action: 'complete' })}
              disabled={processMutation.isPending}
            >
              Complete
            </Button>
          );
        }
        return null;
      },
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
          <p className="text-muted-foreground">Failed to load refunds</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { pending: 0, pendingAmount: 0, completed: 0, completedAmount: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
          <p className="text-muted-foreground">Manage refund requests and processing</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Amount</CardTitle>
            <RefreshCcw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stats.completedAmount)}</div>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            {data?.refunds?.length || 0} refunds found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.refunds || []}
            emptyMessage="No refunds found"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

