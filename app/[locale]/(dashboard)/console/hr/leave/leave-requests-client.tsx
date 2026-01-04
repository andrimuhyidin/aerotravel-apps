'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Check, X, Clock } from 'lucide-react';
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

type LeaveRequest = {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const leaveTypeLabels: Record<string, string> = {
  annual: 'Cuti Tahunan',
  sick: 'Sakit',
  personal: 'Keperluan Pribadi',
  maternity: 'Cuti Melahirkan',
  paternity: 'Cuti Ayah',
  unpaid: 'Cuti Tanpa Gaji',
};

type LeaveRequestsClientProps = {
  locale: string;
};

export function LeaveRequestsClient({ locale: _locale }: LeaveRequestsClientProps) {
  const [status, setStatus] = useState('pending');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'leave-requests', status],
    queryFn: async () => {
      const params = new URLSearchParams({ status });
      const response = await fetch(`/api/admin/hr/leave?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/hr/leave/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!response.ok) throw new Error('Failed to approve');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Leave request approved');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'leave-requests'] });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/hr/leave/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (!response.ok) throw new Error('Failed to reject');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Leave request rejected');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'leave-requests'] });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const handleExport = async () => {
    if (!data?.requests?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.leaveRequests(data.requests);
      downloadFile(buffer, `leave-requests-${status}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (row) => <span className="font-medium">{row.employee_name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (row) => (
        <Badge variant="outline">{leaveTypeLabels[row.leave_type] || row.leave_type}</Badge>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      accessor: (row) => (
        <div className="text-sm">
          <p>{new Date(row.start_date).toLocaleDateString('id-ID')}</p>
          <p className="text-muted-foreground">to {new Date(row.end_date).toLocaleDateString('id-ID')}</p>
        </div>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      accessor: (row) => `${row.total_days} days`,
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (row) => <span className="text-sm max-w-[200px] truncate block">{row.reason}</span>,
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
      accessor: (row) => row.status === 'pending' ? (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-green-600"
            onClick={() => approveMutation.mutate(row.id)}
            disabled={approveMutation.isPending}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-red-600"
            onClick={() => rejectMutation.mutate(row.id)}
            disabled={rejectMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null,
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
          <p className="text-muted-foreground">Failed to load leave requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">Manage employee leave applications</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.rejected || 0}</div>
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
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {data?.requests?.length || 0} requests found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.requests || []}
            emptyMessage="No leave requests"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

