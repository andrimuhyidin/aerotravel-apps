/**
 * Partner Refunds Client Component
 * Refund tracking with list, filter, and detail view
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type Refund = {
  id: string;
  bookingId: string;
  bookingCode: string | null;
  tripDate: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  packageName: string | null;
  packageDestination: string | null;
  originalAmount: number;
  refundPercent: number;
  adminFee: number;
  refundAmount: number;
  daysBeforeTrip: number;
  policyApplied: string | null;
  status: string;
  refundTo: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  isOverride: boolean;
  overrideReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
  disbursementId: string | null;
  requestedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type RefundsResponse = {
  refunds: Refund[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function RefundsClient({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRefunds();
  }, [statusFilter, dateFrom, dateTo, searchQuery, pagination.page]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/partner/refunds?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load refunds');
      }

      const data = (await response.json()) as RefundsResponse;
      setRefunds(data.refunds);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Failed to load refunds', error);
      toast.error('Gagal memuat daftar refund. Silakan refresh halaman.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRefunds();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string; icon: typeof CheckCircle2 }> = {
      pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { label: 'Disetujui', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      processing: { label: 'Diproses', variant: 'default', icon: Loader2 },
      completed: { label: 'Selesai', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      rejected: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="space-y-6 py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Refund</h1>
          <p className="text-muted-foreground">
            Lacak status refund untuk booking Anda
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="processing">Diproses</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Dari Tanggal</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cari Kode Booking</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kode booking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refunds List */}
      {refunds.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Tidak ada refund"
          description="Belum ada refund untuk booking Anda."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Refund</CardTitle>
            <CardDescription>
              Total: {pagination.total} refund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium">Kode Booking</th>
                    <th className="text-left p-3 text-sm font-medium">Customer</th>
                    <th className="text-left p-3 text-sm font-medium">Paket</th>
                    <th className="text-left p-3 text-sm font-medium">Jumlah Refund</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Tanggal</th>
                    <th className="text-right p-3 text-sm font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{refund.bookingCode || '-'}</div>
                        {refund.tripDate && (
                          <div className="text-sm text-muted-foreground">
                            {formatDate(refund.tripDate)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>{refund.customerName || '-'}</div>
                        {refund.customerPhone && (
                          <div className="text-sm text-muted-foreground">
                            {refund.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>{refund.packageName || '-'}</div>
                        {refund.packageDestination && (
                          <div className="text-sm text-muted-foreground">
                            {refund.packageDestination}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(refund.refundAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          dari {formatCurrency(refund.originalAmount)} ({refund.refundPercent}%)
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(refund.status)}</td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(refund.createdAt)}</div>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/${locale}/partner/refunds/${refund.id}`}>
                          <Button variant="ghost" size="sm">
                            Detail
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

