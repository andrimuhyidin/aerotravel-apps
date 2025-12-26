/**
 * Mobile-Optimized Booking Card Component
 * Compact card with swipe actions for mobile
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/partner/package-utils';
import {
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type BookingCardMobileProps = {
  booking: {
    id: string;
    booking_code: string;
    trip_date: string;
    customer_name: string;
    nta_total: number;
    total_amount: number;
    status: string;
    package?: {
      name: string;
    } | null;
  };
  locale: string;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
};

export function BookingCardMobile({
  booking,
  locale,
  onView,
  onEdit,
  onCancel,
}: BookingCardMobileProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_payment: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      ongoing: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_payment: 'Menunggu Pembayaran',
      confirmed: 'Terkonfirmasi',
      ongoing: 'Sedang Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
        {onView && (
          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="h-10 w-10 rounded-full p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-10 w-10 rounded-full p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onCancel && booking.status !== 'cancelled' && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onCancel}
            className="h-10 w-10 rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Card Content */}
      <Card
        className="transition-transform active:scale-[0.98]"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        <CardContent className="p-4">
          <Link href={`/${locale}/partner/bookings/${booking.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm truncate">
                    {booking.booking_code}
                  </span>
                  <Badge
                    className={`text-xs ${getStatusColor(booking.status)} text-white`}
                  >
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>

                <p className="text-sm font-medium text-foreground mb-1 truncate">
                  {booking.package?.name || 'Package'}
                </p>

                <p className="text-xs text-foreground/70 mb-2 truncate">
                  {booking.customer_name}
                </p>

                <div className="flex items-center gap-4 text-xs text-foreground/70">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(booking.trip_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="font-medium text-foreground">
                    {formatCurrency(booking.nta_total)}
                  </div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-foreground/40 flex-shrink-0" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

