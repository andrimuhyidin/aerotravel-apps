/**
 * CRM Dashboard Client Component
 * Customer management, segmentation, and lead tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Crown,
  Download,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  User,
  UserPlus,
  Users,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  segment: 'vip' | 'repeat' | 'new';
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string | null;
  lastBookingStatus: string | null;
};

type Segment = {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  revenue: number;
  avgValue: number;
  color: string;
};

type CustomersResponse = {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  segmentStats: {
    all: number;
    vip: number;
    repeat: number;
    new: number;
  };
};

type SegmentsResponse = {
  segments: Segment[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    avgCustomerValue: number;
  };
};

async function fetchCustomers(
  search: string,
  segment: string,
  page: number
): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    search,
    segment,
    page: page.toString(),
    limit: '20',
  });
  const response = await fetch(`/api/admin/crm/customers?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

async function fetchSegments(): Promise<SegmentsResponse> {
  const response = await fetch('/api/admin/crm/segments');
  if (!response.ok) {
    throw new Error('Failed to fetch segments');
  }
  return response.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CrmClient() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'crm-customers', debouncedSearch, segment, page],
    queryFn: () => fetchCustomers(debouncedSearch, segment, page),
  });

  const { data: segmentsData, isLoading: isLoadingSegments } = useQuery({
    queryKey: [...queryKeys.admin.all, 'crm-segments'],
    queryFn: fetchSegments,
  });

  useEffect(() => {
    if (customersError) {
      toast.error('Gagal memuat data customer');
    }
  }, [customersError]);

  const handleExport = () => {
    toast.info('Fitur export akan segera tersedia');
  };

  if (isLoadingCustomers && isLoadingSegments) {
    return <CrmSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Kelola customer dan segmentasi pelanggan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchCustomers()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Segment Stats Cards */}
      {segmentsData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SegmentCard
            title="Total Customers"
            value={segmentsData.summary.totalCustomers}
            icon={Users}
            color="blue"
          />
          {segmentsData.segments.map((seg) => (
            <SegmentCard
              key={seg.id}
              title={seg.name}
              value={seg.count}
              subtitle={`${seg.percentage}% • ${formatCurrency(seg.avgValue)} avg`}
              icon={seg.id === 'vip' ? Crown : seg.id === 'repeat' ? Star : UserPlus}
              color={seg.color as 'purple' | 'blue' | 'green'}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Customer</CardTitle>
          <CardDescription>
            Total {customersData?.pagination.total || 0} customer ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau telepon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={segment} onValueChange={(v) => { setSegment(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Segment</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="repeat">Repeat</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Last Booking</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersData?.customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))}
                {customersData?.customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada customer ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {customersData && customersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {customersData.pagination.page} dari {customersData.pagination.totalPages}
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
                  disabled={page >= customersData.pagination.totalPages}
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

type SegmentCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
};

function SegmentCard({ title, value, subtitle, icon: Icon, color }: SegmentCardProps) {
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  const segmentBadge = {
    vip: { label: 'VIP', variant: 'default' as const, className: 'bg-purple-600' },
    repeat: { label: 'Repeat', variant: 'secondary' as const, className: '' },
    new: { label: 'New', variant: 'outline' as const, className: '' },
  };
  const badge = segmentBadge[customer.segment];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{customer.fullName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={badge.variant} className={badge.className}>
          {badge.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">{customer.totalBookings}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(customer.totalSpent)}
      </TableCell>
      <TableCell>
        {customer.lastBookingDate ? (
          <span className="text-sm">
            {new Date(customer.lastBookingDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CrmSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

