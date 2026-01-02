/**
 * Partner Customer Detail Client Component
 * Displays customer profile, trip history, and preferences
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthdate: string | null;
  segment: string | null;
  preferences: Record<string, unknown>;
  special_notes: string | null;
  booking_count: number;
  total_spent: number;
  last_trip_date: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  booking_code: string;
  trip_date: string;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  total_amount: number;
  nta_total: number | null;
  status: string;
  created_at: string;
  package: {
    id: string;
    name: string;
    destination: string | null;
  } | null;
};

type CustomerDetailResponse = {
  customer: Customer;
  bookings: Booking[];
};

const SEGMENT_LABELS: Record<string, string> = {
  individual: 'Individu',
  family: 'Keluarga',
  corporate: 'Corporate',
  honeymoon: 'Honeymoon',
  school: 'Sekolah',
};

export function CustomerDetailClient({
  locale,
  customerId,
}: {
  locale: string;
  customerId: string;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCustomerDetail();
  }, [customerId]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/customers/${customerId}`);

      if (!response.ok) {
        throw new Error('Failed to load customer detail');
      }

      const data = (await response.json()) as CustomerDetailResponse;
      setCustomer(data.customer);
      setBookings(data.bookings);
    } catch (error) {
      logger.error('Failed to load customer detail', error, { customerId });
      
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal memuat detail customer. Silakan refresh halaman.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/partner/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      toast.success('Customer berhasil dihapus', {
        duration: 3000,
      });
      router.push(`/${locale}/partner/customers`);
    } catch (error) {
      logger.error('Failed to delete customer', error, { customerId });
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus customer'
      );
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending_payment: {
        label: 'Menunggu Pembayaran',
        className: 'bg-yellow-100 text-yellow-800',
      },
      paid: { label: 'Sudah Dibayar', className: 'bg-green-100 text-green-800' },
      confirmed: { label: 'Terkonfirmasi', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Selesai', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Memuat detail customer...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6 py-6 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Customer tidak ditemukan</p>
            <Link href={`/${locale}/partner/customers`} className="mt-4 inline-block">
              <Button variant="outline">Kembali ke Daftar Customer</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      {/* Breadcrumb */}
      {customer && (
        <Breadcrumb
          items={[
            { label: 'Customers', href: `/${locale}/partner/customers` },
            { label: customer.name },
          ]}
          homeHref={`/${locale}/partner/dashboard`}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/partner/customers`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus Customer
        </Button>
      </div>

      {/* Customer Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
            {customer.segment && (
              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {SEGMENT_LABELS[customer.segment] || customer.segment}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
            {customer.birthdate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(customer.birthdate)}</span>
              </div>
            )}
          </div>

          {customer.special_notes && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Catatan Khusus</h3>
              <p className="text-sm text-muted-foreground">{customer.special_notes}</p>
            </div>
          )}

          {Object.keys(customer.preferences || {}).length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Preferensi</h3>
              <div className="text-sm text-muted-foreground">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(customer.preferences, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Booking</div>
            <div className="text-2xl font-bold">{customer.booking_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Pengeluaran</div>
            <div className="text-2xl font-bold">{formatCurrency(customer.total_spent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Trip Terakhir</div>
            <div className="text-2xl font-bold">
              {customer.last_trip_date ? formatDate(customer.last_trip_date) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada booking untuk customer ini
            </p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/${locale}/partner/bookings/${booking.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {booking.booking_code}
                      </Link>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {booking.package?.name || 'Paket Wisata'}
                    </p>
                    {booking.package?.destination && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {booking.package.destination}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.trip_date)} • {booking.adult_pax} Dewasa,{' '}
                      {booking.child_pax} Anak, {booking.infant_pax} Bayi
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Total</div>
                    <div className="font-semibold">
                      {formatCurrency(booking.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus customer <strong>{customer?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan. Semua data customer akan dihapus permanen.
              {bookings.length > 0 && (
                <span className="block mt-2 text-red-600">
                  ⚠️ Customer ini memiliki {bookings.length} booking yang terkait.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

