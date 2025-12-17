/**
 * Bookings List
 * Route: /[locale]/console/bookings
 */

import { Calendar, Eye, Plus } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Bookings - Aero Console',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export default async function BookingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  type BookingRow = {
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
    packages: { name: string; destination: string } | null;
  };

  const { data } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      trip_date,
      customer_name,
      customer_phone,
      adult_pax,
      child_pax,
      total_amount,
      status,
      created_at,
      packages (name, destination)
    `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const bookings = data as BookingRow[] | null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending_payment: 'Menunggu Bayar',
      paid: 'Lunas',
      confirmed: 'Dikonfirmasi',
      cancelled: 'Dibatalkan',
      completed: 'Selesai',
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || 'bg-gray-100'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Kelola semua booking</p>
        </div>
        <Link href={`/${locale}/console/bookings/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Booking Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Belum ada booking</p>
              <Link href={`/${locale}/console/bookings/new`}>
                <Button variant="outline" className="mt-4">
                  Buat Booking Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Kode</th>
                    <th className="pb-3 font-medium">Paket</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Tanggal Trip</th>
                    <th className="pb-3 font-medium">Pax</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const pkg = booking.packages;
                    return (
                      <tr key={booking.id} className="border-b">
                        <td className="py-3 font-mono text-xs">
                          {booking.booking_code}
                        </td>
                        <td className="py-3">
                          <p className="font-medium">{pkg?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {pkg?.destination}
                          </p>
                        </td>
                        <td className="py-3">
                          <p>{booking.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.customer_phone}
                          </p>
                        </td>
                        <td className="py-3">
                          {new Date(booking.trip_date).toLocaleDateString(
                            'id-ID'
                          )}
                        </td>
                        <td className="py-3">
                          {booking.adult_pax + booking.child_pax}
                        </td>
                        <td className="py-3 font-medium">
                          {formatPrice(booking.total_amount)}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/${locale}/console/bookings/${booking.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
