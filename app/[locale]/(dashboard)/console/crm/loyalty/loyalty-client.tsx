'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Download, Plus, Users } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import queryKeys from '@/lib/queries/query-keys';
import { ReportExporter, downloadFile } from '@/lib/excel/export';

type CustomerLoyalty = {
  id: string;
  customer_name: string;
  email: string;
  current_points: number;
  lifetime_points: number;
  tier: string;
  total_bookings: number;
  joined_at: string;
};

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200',
};

type LoyaltyManagementClientProps = {
  locale: string;
};

export function LoyaltyManagementClient({ locale: _locale }: LoyaltyManagementClientProps) {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.admin.all, 'loyalty', search, tier],
    queryFn: async () => {
      const params = new URLSearchParams({ search, tier });
      const response = await fetch(`/api/admin/crm/loyalty?${params}`);
      if (!response.ok) throw new Error('Failed to fetch loyalty data');
      return response.json();
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ customerId, points, reason }: { customerId: string; points: number; reason: string }) => {
      const response = await fetch('/api/admin/crm/loyalty/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, points, reason }),
      });
      if (!response.ok) throw new Error('Failed to adjust points');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Points adjusted successfully');
      setAdjustDialogOpen(false);
      setSelectedCustomer(null);
      setAdjustPoints('');
      setAdjustReason('');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.admin.all, 'loyalty'] });
    },
    onError: () => toast.error('Failed to adjust points'),
  });

  const handleAdjust = (customer: CustomerLoyalty) => {
    setSelectedCustomer(customer);
    setAdjustDialogOpen(true);
  };

  const submitAdjust = () => {
    if (!selectedCustomer || !adjustPoints || !adjustReason) {
      toast.error('Please fill all fields');
      return;
    }
    adjustMutation.mutate({
      customerId: selectedCustomer.id,
      points: parseInt(adjustPoints, 10),
      reason: adjustReason,
    });
  };

  const handleExport = async () => {
    if (!data?.customers?.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const buffer = await ReportExporter.loyaltyAdjustments(data.customers);
      downloadFile(buffer, 'loyalty-customers.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export successful');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: DataTableColumn<CustomerLoyalty>[] = [
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-medium">{row.customer_name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (row) => (
        <Badge variant="outline" className={tierColors[row.tier] || 'bg-gray-100'}>
          <Award className="h-3 w-3 mr-1" />
          {row.tier}
        </Badge>
      ),
    },
    {
      key: 'current_points',
      header: 'Current Points',
      accessor: (row) => <span className="font-medium">{row.current_points.toLocaleString()}</span>,
    },
    {
      key: 'lifetime_points',
      header: 'Lifetime Points',
      accessor: (row) => row.lifetime_points.toLocaleString(),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      accessor: (row) => row.total_bookings,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <Button size="sm" variant="outline" onClick={() => handleAdjust(row)}>
          <Plus className="h-4 w-4 mr-1" />
          Adjust
        </Button>
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
          <p className="text-muted-foreground">Failed to load loyalty data</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { totalMembers: 0, totalPoints: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loyalty Management</h1>
          <p className="text-muted-foreground">Manage customer loyalty points and tiers</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Customer name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Members</CardTitle>
          <CardDescription>
            {data?.customers?.length || 0} members found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.customers || []}
            emptyMessage="No loyalty members found"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Loyalty Points</DialogTitle>
            <DialogDescription>
              Adjust points for {selectedCustomer?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Points</Label>
              <p className="text-lg font-semibold">{selectedCustomer?.current_points.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Points Adjustment</Label>
              <Input
                type="number"
                placeholder="e.g., 100 or -50"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use negative value to deduct points</p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Reason for adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAdjust} disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

