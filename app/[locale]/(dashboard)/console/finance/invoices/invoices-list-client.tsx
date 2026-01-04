'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Eye, Printer } from 'lucide-react';
import Link from 'next/link';
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

type Invoice = {
  id: string;
  invoice_number: string;
  booking_id: string;
  booking_code: string;
  customer_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  sent_at: string | null;
  paid_at: string | null;
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

type InvoicesListClientProps = {
  locale: string;
};

export function InvoicesListClient({ locale }: InvoicesListClientProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.finance.invoices.list({ search, status }),
    queryFn: async () => {
      const params = new URLSearchParams({ search, status });
      const response = await fetch(`/api/admin/finance/invoices?${params}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/admin/finance/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to send invoice');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Invoice sent successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.finance.invoices.all() });
    },
    onError: () => toast.error('Failed to send invoice'),
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: 'invoice',
      header: 'Invoice #',
      accessor: (row) => <span className="font-mono font-medium">{row.invoice_number}</span>,
    },
    {
      key: 'booking',
      header: 'Booking',
      accessor: (row) => (
        <Link href={`/${locale}/console/bookings/${row.booking_id}`} className="text-blue-600 hover:underline">
          {row.booking_code}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => row.customer_name,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (row) => (
        <div>
          <p className="font-medium">{formatCurrency(row.total_amount)}</p>
          <p className="text-xs text-muted-foreground">Tax: {formatCurrency(row.tax_amount)}</p>
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      accessor: (row) => new Date(row.due_date).toLocaleDateString('id-ID'),
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
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Printer className="h-4 w-4" />
          </Button>
          {row.status === 'draft' && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => sendMutation.mutate(row.id)}
              disabled={sendMutation.isPending}
            >
              <Send className="h-4 w-4" />
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
          <p className="text-muted-foreground">Failed to load invoices</p>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats || { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Generate and manage invoices</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
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
                placeholder="Invoice # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {data?.invoices?.length || 0} invoices found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.invoices || []}
            emptyMessage="No invoices found"
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}

