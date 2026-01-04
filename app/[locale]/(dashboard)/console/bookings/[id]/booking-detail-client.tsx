/**
 * Booking Detail Client Component
 * Display full booking information, payments, trip assignment, and activity
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Edit,
  Mail,
  MapPin,
  Package,
  Phone,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { useBookingRealtime } from '@/hooks/use-booking-realtime';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type BookingDetail = {
  id: string;
  booking_code: string;
  trip_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  total_amount: number;
  discount_amount: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  packages: {
    id: string;
    name: string;
    destination: string;
    trip_type: string;
    duration_days: number | null;
  } | null;
  trip: {
    id: string;
    trip_code: string;
    trip_date: string;
    status: string;
    guides?: {
      full_name: string;
      phone: string;
    };
  } | null;
  guide: {
    full_name: string;
    phone: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
  }>;
  activityLog: Array<{
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
    users: {
      full_name: string;
      email: string;
    } | null;
  }>;
};

type BookingDetailClientProps = {
  bookingId: string;
  locale: string;
};

async function fetchBookingDetail(bookingId: string): Promise<BookingDetail> {
  const response = await fetch(`/api/admin/bookings/${bookingId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch booking details');
  }
  const data = await response.json();
  return data.booking;
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

export function BookingDetailClient({
  bookingId,
  locale,
}: BookingDetailClientProps) {
  // Realtime sync for booking updates
  const { isSubscribed: realtimeStatus } = useBookingRealtime(bookingId);

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.admin.bookings.detail(bookingId),
    queryFn: () => fetchBookingDetail(bookingId),
  });

  if (isLoading) {
    return <BookingDetailSkeleton />;
  }

  if (error || !booking) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">Failed to load booking details</p>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/console/bookings`}>Back to Bookings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPax = booking.adult_pax + booking.child_pax + booking.infant_pax;
  const finalAmount = booking.total_amount - (booking.discount_amount || 0);

  const paymentColumns: DataTableColumn<BookingDetail['payments'][0]>[] = [
    {
      key: 'amount',
      header: 'Amount',
      accessor: (payment) => (
        <span className="font-medium">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(payment.amount)}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      accessor: (payment) => (
        <span className="text-sm capitalize">{payment.payment_method}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (payment) => (
        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
          {payment.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (payment) => (
        <span className="text-sm text-muted-foreground">
          {new Date(payment.created_at).toLocaleString('id-ID')}
        </span>
      ),
    },
  ];

  const activityColumns: DataTableColumn<BookingDetail['activityLog'][0]>[] = [
    {
      key: 'action',
      header: 'Action',
      accessor: (activity) => (
        <Badge variant="outline" className="uppercase text-xs">
          {activity.action}
        </Badge>
      ),
    },
    {
      key: 'user',
      header: 'User',
      accessor: (activity) => (
        <span className="text-sm">
          {activity.users?.full_name || activity.users?.email || 'System'}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (activity) => (
        <span className="text-sm text-muted-foreground">
          {new Date(activity.created_at).toLocaleString('id-ID')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/console/bookings`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Booking Details</h1>
              {realtimeStatus && (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3 text-green-600" />
                  <span className="text-xs">Live</span>
                </Badge>
              )}
              {!realtimeStatus && (
                <Badge variant="outline" className="gap-1">
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Offline</span>
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {booking.booking_code}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/console/bookings/${bookingId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Booking
          </Link>
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge
                variant="outline"
                className={cn(
                  'text-base px-4 py-2',
                  statusColors[booking.status] || 'bg-gray-100 text-gray-800'
                )}
              >
                {statusLabels[booking.status] || booking.status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(finalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.customer_name}</span>
            </div>
            {booking.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.customer_phone}</span>
              </div>
            )}
            {booking.customer_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.customer_email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card>
          <CardHeader>
            <CardTitle>Package & Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.packages && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{booking.packages.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.packages.destination}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(booking.trip_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            {booking.trip && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{booking.trip.trip_code}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {booking.trip.status}
                  </p>
                </div>
              </div>
            )}
            {booking.guide && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{booking.guide.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.guide.phone}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Adult Pax</p>
              <p className="text-lg font-medium">{booking.adult_pax}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Child Pax</p>
              <p className="text-lg font-medium">{booking.child_pax}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Pax</p>
              <p className="text-lg font-medium">{totalPax}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(booking.total_amount)}
              </span>
            </div>
            {booking.discount_amount && booking.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-sm">Discount</span>
                <span className="font-medium">
                  -{new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(booking.discount_amount)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(finalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All payment transactions for this booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {booking.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded
                </p>
              ) : (
                <DataTable
                  columns={paymentColumns}
                  data={booking.payments}
                  emptyMessage="No payments found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Recent actions performed on this booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {booking.activityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity found
                </p>
              ) : (
                <DataTable
                  columns={activityColumns}
                  data={booking.activityLog}
                  emptyMessage="No activity found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

