/**
 * Booking History List - Recent bookings dengan load more
 * Simple list untuk quick reference
 */

'use client';

import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/partner/package-utils';
import { cn } from '@/lib/utils';

type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'draft';

type RecentBooking = {
  id: string;
  bookingCode: string;
  packageName: string;
  totalAmount: number;
  commission: number;
  status: OrderStatus;
  createdAt: string;
};

type BookingHistoryListProps = {
  bookings: RecentBooking[];
  locale: string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

export function BookingHistoryList({
  bookings,
  locale,
  loading = false,
  onLoadMore,
  hasMore = false,
}: BookingHistoryListProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (onLoadMore) {
      setLoadingMore(true);
      await onLoadMore();
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <BookingHistoryListSkeleton />;
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada riwayat booking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingListItem key={booking.id} booking={booking} locale={locale} />
      ))}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void handleLoadMore()}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}

type BookingListItemProps = {
  booking: RecentBooking;
  locale: string;
};

function BookingListItem({ booking, locale }: BookingListItemProps) {
  const statusConfig = getStatusConfig(booking.status);

  return (
    <Link href={`/${locale}/partner/bookings/${booking.id}`}>
      <Card className="transition-all hover:shadow-md active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Date & Booking Code */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {new Date(booking.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="font-semibold text-xs truncate">
                  {booking.bookingCode}
                </span>
              </div>

              {/* Package Name */}
              <p className="mb-2 text-sm font-medium text-foreground truncate">
                {booking.packageName}
              </p>

              {/* Amount & Commission */}
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Komisi: </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(booking.commission)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                className={cn('text-[10px]', statusConfig.className)}
                variant="secondary"
              >
                {statusConfig.label}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getStatusConfig(status: OrderStatus) {
  const configs: Record<
    OrderStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700',
    },
    pending_payment: {
      label: 'Menunggu',
      className: 'bg-orange-100 text-orange-700',
    },
    confirmed: {
      label: 'Terkonfirmasi',
      className: 'bg-blue-100 text-blue-700',
    },
    ongoing: {
      label: 'Berlangsung',
      className: 'bg-purple-100 text-purple-700',
    },
    completed: {
      label: 'Selesai',
      className: 'bg-green-100 text-green-700',
    },
    cancelled: {
      label: 'Dibatalkan',
      className: 'bg-red-100 text-red-700',
    },
  };

  return configs[status] || configs.draft;
}

function BookingHistoryListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

