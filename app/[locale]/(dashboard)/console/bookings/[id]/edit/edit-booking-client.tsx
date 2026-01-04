/**
 * Edit Booking Client Component
 * Wrapper for edit booking form with data fetching
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

import { EditBookingForm } from './edit-booking-form';

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
  special_requests: string | null;
  status: string;
  total_amount: number;
  packages: {
    id: string;
    name: string;
    destination: string;
  } | null;
};

type EditBookingClientProps = {
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

export function EditBookingClient({ bookingId, locale }: EditBookingClientProps) {
  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.admin.bookings.detail(bookingId),
    queryFn: () => fetchBookingDetail(bookingId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading booking</p>
            <Button asChild>
              <Link href={`/${locale}/console/bookings`}>Back to Bookings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Booking not found</p>
            <Button asChild>
              <Link href={`/${locale}/console/bookings`}>Back to Bookings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/console/bookings/${bookingId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Booking</h1>
          <p className="text-muted-foreground">
            {booking.booking_code}
          </p>
        </div>
      </div>

      <EditBookingForm booking={booking} locale={locale} />
    </div>
  );
}

