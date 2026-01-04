'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type AttendanceRecord = {
  id: string;
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  late_minutes: number;
  work_hours: number;
  notes: string | null;
};

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  leave: 'bg-blue-100 text-blue-800',
  sick: 'bg-orange-100 text-orange-800',
  remote: 'bg-purple-100 text-purple-800',
};

const statusLabels: Record<string, string> = {
  present: 'Hadir',
  absent: 'Tidak Hadir',
  late: 'Terlambat',
  leave: 'Cuti',
  sick: 'Sakit',
  remote: 'Remote',
};

type AttendanceListClientProps = {
  locale: string;
};

export function AttendanceListClient({ locale: _locale }: AttendanceListClientProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [status, setStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'attendance', date, status],
    queryFn: async () => {
      const params = new URLSearchParams({ date, status });
      const response = await fetch(`/api/admin/hr/attendance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
  });

  const handleExport = async () => {
    if (!data?.attendance?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.attendance(data.attendance);
      downloadFile(buffer, `attendance-${date}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: 'employee',
      header: 'Employee',
      accessor: (row) => <span className="font-medium">{row.employee_name}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (row) => new Date(row.attendance_date).toLocaleDateString('id-ID'),
    },
    {
      key: 'check_in',
      header: 'Check In',
      accessor: (row) => row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'check_out',
      header: 'Check Out',
      accessor: (row) => row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'work_hours',
      header: 'Hours',
      accessor: (row) => `${row.work_hours.toFixed(1)}h`,
    },
    {
      key: 'late',
      header: 'Late',
      accessor: (row) => row.late_minutes > 0 ? (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          {row.late_minutes}m
        </Badge>
      ) : '-',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge className={statusColors[row.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[row.status] || row.status}
        </Badge>
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
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-muted-foreground">Failed to load attendance data</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { present: 0, absent: 0, late: 0, leave: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track employee attendance records</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leave}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {data?.attendance?.length || 0} records found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.attendance || []}
            emptyMessage="No attendance records"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

