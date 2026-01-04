/**
 * Corporate Bookings List Client Component
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  Plus,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

type Booking = {
  id: string;
  bookingCode: string;
  packageName: string;
  destination: string;
  tripDate: string;
  employeeName: string;
  employeeDepartment: string | null;
  totalPax: number;
  totalAmount: number;
  status: string;
  approvalStatus: string | null;
  createdAt: string;
};

type BookingsResponse = {
  bookings: Booking[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type BookingsListClientProps = {
  locale: string;
};

export function BookingsListClient({ locale }: BookingsListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, isFetching } = useQuery<BookingsResponse>({
    queryKey: ['corporate', 'bookings', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await apiClient.get(
        `/api/partner/corporate/bookings?${params}`
      );
      return response.data as BookingsResponse;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusBadge = (status: string, approvalStatus: string | null) => {
    if (approvalStatus === 'pending') {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Ditolak
        </Badge>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Selesai
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Terkonfirmasi
          </Badge>
        );
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">Lunas</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="secondary">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Booking</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total || 0} booking
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/corporate/bookings/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Booking Baru
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="all">Semua Status</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="confirmed">Terkonfirmasi</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Booking List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !data?.bookings.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium mb-1">Belum ada booking</p>
            <p className="text-sm text-muted-foreground mb-4">
              Buat booking pertama untuk karyawan
            </p>
            <Button asChild>
              <Link href={`/${locale}/corporate/bookings/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Booking Sekarang
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/${locale}/corporate/bookings/${booking.id}`}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{booking.bookingCode}</p>
                        {getStatusBadge(booking.status, booking.approvalStatus)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {booking.packageName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {booking.destination}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {booking.employeeName}
                          {booking.employeeDepartment &&
                            ` (${booking.employeeDepartment})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(booking.tripDate), 'd MMM yyyy', {
                            locale: id,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.totalPax} pax
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {data.pagination.total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Halaman {page + 1} dari{' '}
                {Math.ceil(data.pagination.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore || isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

