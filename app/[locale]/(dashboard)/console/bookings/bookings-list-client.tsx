/**
 * Bookings List Client Component
 * Enhanced with filters, search, export, and bulk actions
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  X,
  Trash,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import { toast } from 'sonner';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import queryKeys from '@/lib/queries/query-keys';
import { ReportExporter } from '@/lib/excel/export';
import { downloadFile } from '@/lib/excel/export';
import { logger } from '@/lib/utils/logger';

type Booking = {
  id: string;
  booking_code: string;
  trip_date: string;
  customer_name: string;
  customer_phone: string;
  adult_pax: number;
  child_pax: number;
  total_amount: number;
  status: string;
  created_at: string;
  packages: {
    name: string;
    destination: string;
  } | null;
};

type BookingsResponse = {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchBookings(
  search: string,
  status: string,
  startDate: string,
  endDate: string,
  packageId: string,
  page: number
): Promise<BookingsResponse> {
  const params = new URLSearchParams({
    search,
    status,
    startDate,
    endDate,
    packageId,
    page: page.toString(),
    limit: '50',
  });
  const response = await fetch(`/api/admin/bookings?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
}

async function fetchPackages(): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch('/api/admin/packages?limit=100');
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.packages || [];
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'Menunggu Bayar',
  paid: 'Lunas',
  confirmed: 'Dikonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

type BookingsListClientProps = {
  locale: string;
};

export function BookingsListClient({ locale }: BookingsListClientProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [packageId, setPackageId] = useState('all');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Bulk selection
  const bulkSelection = useBulkSelection<Booking>();
  const getBookingKey = useCallback((booking: Booking) => booking.id, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear selection when filters change
  useEffect(() => {
    bulkSelection.clear();
  }, [debouncedSearch, status, startDate, endDate, packageId, page]);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.admin.bookings.list({ 
      search: debouncedSearch, 
      status, 
      startDate, 
      endDate, 
      packageId, 
      page 
    }),
    queryFn: () => fetchBookings(debouncedSearch, status, startDate, endDate, packageId, page),
  });

  const { data: packagesData = [] } = useQuery({
    queryKey: queryKeys.admin.packages.list({}),
    queryFn: fetchPackages,
  });

  const handleExport = async () => {
    if (!data?.bookings || data.bookings.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = data.bookings.map((booking) => ({
        code: booking.booking_code,
        trip_date: booking.trip_date,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        package_name: booking.packages?.name || '-',
        destination: booking.packages?.destination || '-',
        adult_pax: booking.adult_pax,
        child_pax: booking.child_pax,
        total_pax: booking.adult_pax + booking.child_pax,
        total_amount: booking.total_amount,
        status: statusLabels[booking.status] || booking.status,
        created_at: booking.created_at,
      }));

      const buffer = await ReportExporter.bookings(exportData, `bookings-${startDate || 'all'}-${endDate || 'all'}`);
      downloadFile(buffer, `bookings-${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success('Export berhasil');
    } catch (error) {
      logger.error('Export error', error);
      toast.error('Gagal export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkAction = async (actionId: string) => {
    const selectedIds = Array.from(bulkSelection.selectedIds);
    if (selectedIds.length === 0) return;

    setIsBulkProcessing(true);
    setBulkProgress(0);

    try {
      if (actionId === 'export') {
        // Export selected bookings
        const selectedBookings = data?.bookings.filter(b => bulkSelection.isSelected(b.id)) || [];
        const exportData = selectedBookings.map((booking) => ({
          code: booking.booking_code,
          trip_date: booking.trip_date,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          package_name: booking.packages?.name || '-',
          destination: booking.packages?.destination || '-',
          adult_pax: booking.adult_pax,
          child_pax: booking.child_pax,
          total_pax: booking.adult_pax + booking.child_pax,
          total_amount: booking.total_amount,
          status: statusLabels[booking.status] || booking.status,
          created_at: booking.created_at,
        }));

        const buffer = await ReportExporter.bookings(exportData, `bookings-selected`);
        downloadFile(buffer, `bookings-selected-${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        toast.success(`${selectedIds.length} booking berhasil di-export`);
        bulkSelection.clear();
        return;
      }

      // API bulk actions
      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionId === 'delete' ? 'delete' : 'cancel',
          ids: selectedIds,
          payload: actionId === 'cancel' ? { reason: 'Bulk cancellation by admin' } : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk action failed');
      }

      toast.success(`Berhasil: ${result.summary.successful}, Gagal: ${result.summary.failed}`);
      bulkSelection.clear();
      refetch();
    } catch (error) {
      logger.error('Bulk action error', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memproses bulk action');
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress(0);
    }
  };

  if (isLoading) {
    return <BookingsListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Failed to load bookings</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allSelected = Boolean(data?.bookings && data.bookings.length > 0 && 
    data.bookings.every(b => bulkSelection.isSelected(b.id)));
  const someSelected = Boolean(data?.bookings && data.bookings.some(b => bulkSelection.isSelected(b.id)));

  const columns: DataTableColumn<Booking>[] = [
    {
      key: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected && !allSelected;
            }
          }}
          onCheckedChange={() => {
            if (data?.bookings) {
              bulkSelection.toggleAll(data.bookings, getBookingKey);
            }
          }}
          aria-label="Select all"
        />
      ),
      accessor: (booking) => (
        <Checkbox
          checked={bulkSelection.isSelected(booking.id)}
          onCheckedChange={() => bulkSelection.toggle(booking.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${booking.booking_code}`}
        />
      ),
      className: 'w-[40px]',
    },
    {
      key: 'code',
      header: 'Kode',
      accessor: (booking) => (
        <span className="font-mono text-xs">{booking.booking_code}</span>
      ),
    },
    {
      key: 'package',
      header: 'Paket',
      accessor: (booking) => (
        <div>
          <p className="font-medium">{booking.packages?.name || '-'}</p>
          <p className="text-xs text-muted-foreground">
            {booking.packages?.destination || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (booking) => (
        <div>
          <p>{booking.customer_name}</p>
          <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
        </div>
      ),
    },
    {
      key: 'trip_date',
      header: 'Tanggal Trip',
      accessor: (booking) => (
        <span className="text-sm">
          {new Date(booking.trip_date).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'pax',
      header: 'Pax',
      accessor: (booking) => (
        <span className="text-sm">{booking.adult_pax + booking.child_pax}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Total',
      accessor: (booking) => (
        <span className="font-medium">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(booking.total_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (booking) => (
        <Badge
          variant="outline"
          className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}
        >
          {statusLabels[booking.status] || booking.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      accessor: (booking) => (
        <Link href={`/${locale}/console/bookings/${booking.id}`}>
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
      className: 'w-[50px]',
    },
  ];

  const hasFilters = status !== 'all' || startDate || endDate || packageId !== 'all' || debouncedSearch;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Kelola semua booking</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !data?.bookings || data.bookings.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button asChild>
            <Link href={`/${locale}/console/bookings/new`}>
              <Calendar className="mr-2 h-4 w-4" />
              Booking Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} bookings found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Kode, nama, telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_payment">Menunggu Bayar</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Paket</Label>
              <Select value={packageId} onValueChange={(v) => { setPackageId(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {packagesData.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setStartDate('');
                setEndDate('');
                setPackageId('all');
                setPage(1);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.bookings || []}
            loading={isRefetching}
            emptyMessage="No bookings found"
            emptyDescription="Try adjusting your filters or create a new booking"
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
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

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={bulkSelection.count}
        totalCount={data?.bookings.length || 0}
        actions={[
          {
            id: 'export',
            label: 'Export',
            icon: Download,
            variant: 'outline',
          },
          {
            id: 'cancel',
            label: 'Batalkan',
            icon: XCircle,
            variant: 'outline',
            requiresConfirmation: true,
            confirmTitle: 'Batalkan Booking?',
            confirmDescription: 'Booking yang dipilih akan dibatalkan. Customer akan menerima notifikasi pembatalan.',
            loadingLabel: 'Membatalkan...',
          },
          {
            id: 'delete',
            label: 'Hapus',
            icon: Trash,
            variant: 'destructive',
            requiresConfirmation: true,
            confirmTitle: 'Hapus Booking?',
            confirmDescription: 'Tindakan ini tidak dapat dibatalkan. Data booking akan dihapus secara permanen.',
            loadingLabel: 'Menghapus...',
          },
        ]}
        onAction={handleBulkAction}
        onClear={bulkSelection.clear}
        isProcessing={isBulkProcessing}
        progress={bulkProgress}
        itemLabel="booking"
      />
    </div>
  );
}

function BookingsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

