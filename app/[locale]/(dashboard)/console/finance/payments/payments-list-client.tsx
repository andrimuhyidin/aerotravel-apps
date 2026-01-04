'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Check, 
  X, 
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentsListRealtimeSync } from '@/hooks/use-payment-realtime';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  payment_channel: string;
  status: string;
  proof_url: string | null;
  verification_status: string;
  verified_at: string | null;
  created_at: string;
  bookings: {
    id: string;
    booking_code: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
  };
  verifier?: {
    full_name: string;
  } | null;
};

type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PaymentsListClientProps = {
  locale: string;
  initialParams?: Record<string, string | string[] | undefined>;
};

async function fetchPayments(params: URLSearchParams): Promise<PaymentsResponse> {
  const response = await fetch(`/api/admin/finance/payments?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch payments');
  }
  return response.json();
}

export function PaymentsListClient({ locale, initialParams }: PaymentsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Realtime sync for payment updates
  const { status: realtimeStatus } = usePaymentsListRealtimeSync();

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [verificationStatus, setVerificationStatus] = useState(
    searchParams.get('verificationStatus') || 'all'
  );
  const [paymentStatus, setPaymentStatus] = useState(
    searchParams.get('status') || 'all'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (verificationStatus !== 'all') params.set('verificationStatus', verificationStatus);
    if (paymentStatus !== 'all') params.set('status', paymentStatus);
    params.set('page', page.toString());
    params.set('limit', '20');
    return params;
  }, [search, verificationStatus, paymentStatus, page]);

  // Fetch payments
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.admin.payments.list({ search, verificationStatus, paymentStatus, page }),
    queryFn: () => fetchPayments(buildQueryParams()),
    staleTime: 30_000,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = buildQueryParams();
    router.replace(`/${locale}/console/finance/payments?${params.toString()}`, {
      scroll: false,
    });
  }, [search, verificationStatus, paymentStatus, page, locale, router, buildQueryParams]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVerificationStatusBadge = (status: string) => {
    const defaultConfig = {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="mr-1 h-3 w-3" />,
    };

    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: defaultConfig,
      verified: {
        label: 'Verified',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Check className="mr-1 h-3 w-3" />,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <X className="mr-1 h-3 w-3" />,
      },
      more_info_needed: {
        label: 'Info Needed',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <HelpCircle className="mr-1 h-3 w-3" />,
      },
    };

    const config = statusConfig[status] ?? defaultConfig;
    
    return (
      <Badge variant="outline" className={cn("flex items-center", config.className)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari booking code atau nama..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={verificationStatus}
            onValueChange={(value) => {
              setVerificationStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="more_info_needed">Info Needed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentStatus}
            onValueChange={(value) => {
              setPaymentStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {realtimeStatus === 'connected' && (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3 text-green-600" />
              <span className="text-xs">Live</span>
            </Badge>
          )}
          {realtimeStatus === 'disconnected' && (
            <Badge variant="outline" className="gap-1">
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">Offline</span>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Bukti</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data?.payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <p className="text-muted-foreground">
                    Tidak ada pembayaran ditemukan
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              data?.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link
                      href={`/${locale}/console/bookings/${payment.booking_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {payment.bookings?.booking_code || '-'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.bookings?.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.bookings?.customer_phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    {payment.proof_url ? (
                      <div className="flex items-center gap-1">
                        <FileImage className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600">Ada</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getVerificationStatusBadge(payment.verification_status || 'pending')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/${locale}/console/finance/payments/${payment.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(data.pagination.page - 1) * data.pagination.limit + 1} -{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} dari{' '}
            {data.pagination.total} pembayaran
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

