/**
 * Active Orders Summary - Status count dan order cards
 * Display pesanan yang butuh action dengan status summary
 */

'use client';

import {
  Calendar,
  ChevronRight,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/partner/package-utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

type ActiveOrder = {
  id: string;
  bookingCode: string;
  packageName: string;
  customerName: string;
  tripDate: string;
  status: OrderStatus;
  totalAmount: number;
  commission: number;
  createdAt: string;
};

type ActiveOrdersSummaryProps = {
  orders: ActiveOrder[];
  loading?: boolean;
  onSendReminder?: (orderId: string) => void;
};

export function ActiveOrdersSummary({
  orders,
  loading = false,
  onSendReminder,
}: ActiveOrdersSummaryProps) {
  const params = useParams();
  const locale = params.locale as string;

  if (loading) {
    return <ActiveOrdersSummarySkeleton />;
  }

  const pending = orders.filter((o) => o.status === 'pending_payment');
  const confirmed = orders.filter((o) => o.status === 'confirmed');
  const ongoing = orders.filter((o) => o.status === 'ongoing');

  const totalActive = pending.length + confirmed.length + ongoing.length;

  if (totalActive === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="mb-2 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            Tidak ada pesanan aktif
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Semua pesanan sudah selesai atau belum ada pesanan baru
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Count Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatusCountCard
          status="pending"
          count={pending.length}
          label="Menunggu"
          color="orange"
        />
        <StatusCountCard
          status="confirmed"
          count={confirmed.length}
          label="Terkonfirmasi"
          color="blue"
        />
        <StatusCountCard
          status="ongoing"
          count={ongoing.length}
          label="Berlangsung"
          color="green"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            locale={locale}
            onSendReminder={onSendReminder}
          />
        ))}
      </div>

      {/* View All Link */}
      {orders.length > 5 && (
        <Link
          href={`/${locale}/partner/bookings`}
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Lihat Semua Pesanan
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

type StatusCountCardProps = {
  status: string;
  count: number;
  label: string;
  color: 'orange' | 'blue' | 'green';
};

function StatusCountCard({ status, count, label, color }: StatusCountCardProps) {
  const colorClasses = {
    orange: 'bg-orange-500/15 border-orange-200 text-orange-700 dark:text-orange-400 dark:border-orange-800',
    blue: 'bg-blue-500/15 border-blue-200 text-blue-700 dark:text-blue-400 dark:border-blue-800',
    green: 'bg-green-500/15 border-green-200 text-green-700 dark:text-green-400 dark:border-green-800',
  };

  return (
    <Card className={cn('border-2', colorClasses[color])}>
      <CardContent className="p-3 text-center">
        <div className="mb-1 text-2xl font-bold">{count}</div>
        <div className="text-xs font-medium leading-tight">{label}</div>
      </CardContent>
    </Card>
  );
}

type OrderCardProps = {
  order: ActiveOrder;
  locale: string;
  onSendReminder?: (orderId: string) => void;
};

function OrderCard({ order, locale, onSendReminder }: OrderCardProps) {
  const { icon: StatusIcon, color } = getStatusConfig(order.status);

  const handleSendReminder = async () => {
    if (onSendReminder) {
      onSendReminder(order.id);
    } else {
      toast.success('Reminder dikirim ke customer');
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <Link href={`/${locale}/partner/bookings/${order.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Booking Code & Package */}
              <div className="mb-2 flex items-start gap-2">
                <StatusIcon
                  className={cn('mt-0.5 h-4 w-4 flex-shrink-0', color)}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {order.bookingCode}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {order.packageName}
                  </p>
                </div>
              </div>

              {/* Customer & Trip Date */}
              <div className="mb-2 space-y-1">
                <p className="text-xs text-foreground truncate">
                  {order.customerName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {new Date(order.tripDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Amount & Commission */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Komisi</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(order.commission)}
                </span>
              </div>
            </div>

            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </Link>

        {/* Quick Actions */}
        {order.status === 'pending_payment' && (
          <div className="mt-3 flex gap-2 border-t pt-3">
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex-1 gap-1.5 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleSendReminder();
              }}
            >
              <Send className="h-3 w-3" />
              Kirim Reminder
            </Button>
            <Link href={`/${locale}/partner/bookings/${order.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
              >
                <Eye className="h-3 w-3" />
                Detail
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusConfig(status: OrderStatus) {
  const configs = {
    pending_payment: { icon: Clock, color: 'text-orange-500' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-500' },
    ongoing: { icon: Loader2, color: 'text-green-500' },
    completed: { icon: CheckCircle2, color: 'text-green-500' },
    cancelled: { icon: AlertCircle, color: 'text-red-500' },
  };

  return configs[status] || configs.pending_payment;
}

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_payment: 'Menunggu Pembayaran',
    confirmed: 'Terkonfirmasi',
    ongoing: 'Berlangsung',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  return labels[status] || status;
}

function ActiveOrdersSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
