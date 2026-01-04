'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileBarChart, Plus, Play, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';

type CustomReport = {
  id: string;
  name: string;
  description: string;
  data_source: string;
  columns: string[];
  filters: Record<string, unknown>;
  schedule: string | null;
  last_run_at: string | null;
  created_by_name: string;
  created_at: string;
};

const dataSourceLabels: Record<string, string> = {
  bookings: 'Bookings',
  payments: 'Payments',
  customers: 'Customers',
  guides: 'Guides',
  packages: 'Packages',
  trips: 'Trips',
};

type CustomReportsClientProps = {
  locale: string;
};

export function CustomReportsClient({ locale: _locale }: CustomReportsClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    data_source: 'bookings',
    columns: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'custom-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/custom');
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (report: typeof newReport) => {
      const response = await fetch('/api/admin/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!response.ok) throw new Error('Failed to create report');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Report created successfully');
      setCreateDialogOpen(false);
      setNewReport({ name: '', description: '', data_source: 'bookings', columns: [] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'custom-reports'] });
    },
    onError: () => toast.error('Failed to create report'),
  });

  const executeMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/admin/reports/custom/${reportId}/execute`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to execute report');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Report executed successfully');
      // Handle download if data is returned
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => toast.error('Failed to execute report'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/admin/reports/custom/${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Report deleted');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'custom-reports'] });
    },
    onError: () => toast.error('Failed to delete report'),
  });

  const columns: DataTableColumn<CustomReport>[] = [
    {
      key: 'name',
      header: 'Report Name',
      accessor: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'data_source',
      header: 'Data Source',
      accessor: (row) => (
        <Badge variant="outline">{dataSourceLabels[row.data_source] || row.data_source}</Badge>
      ),
    },
    {
      key: 'columns',
      header: 'Columns',
      accessor: (row) => <span className="text-sm">{row.columns?.length || 0} columns</span>,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      accessor: (row) => row.schedule ? (
        <Badge className="bg-blue-100 text-blue-800">{row.schedule}</Badge>
      ) : (
        <span className="text-muted-foreground">Manual</span>
      ),
    },
    {
      key: 'last_run',
      header: 'Last Run',
      accessor: (row) => row.last_run_at ? new Date(row.last_run_at).toLocaleString('id-ID') : '-',
    },
    {
      key: 'created_by',
      header: 'Created By',
      accessor: (row) => row.created_by_name,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => executeMutation.mutate(row.id)}
            disabled={executeMutation.isPending}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-600"
            onClick={() => {
              if (confirm('Are you sure you want to delete this report?')) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
          <p className="text-muted-foreground">Failed to load custom reports</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Reports</h1>
          <p className="text-muted-foreground">Build and manage custom report templates</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileBarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <FileBarChart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.reports?.filter((r: CustomReport) => r.schedule)?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Run Today</CardTitle>
            <Play className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.runToday || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reports</CardTitle>
          <CardDescription>
            Custom report templates you've created
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.reports || []}
            emptyMessage="No custom reports yet"
            emptyDescription="Create your first custom report to get started"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Define a new report template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                placeholder="e.g., Monthly Revenue Summary"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this report show?"
                value={newReport.description}
                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select 
                value={newReport.data_source} 
                onValueChange={(v) => setNewReport({ ...newReport, data_source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bookings">Bookings</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                  <SelectItem value="packages">Packages</SelectItem>
                  <SelectItem value="trips">Trips</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate(newReport)}
                disabled={createMutation.isPending || !newReport.name}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

