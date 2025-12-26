/**
 * Partner Customer Detail Client Component
 * REDESIGNED - Clean sections, Timeline, Booking history
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, InfoCard, StatusBadge, Timeline } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Edit } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  dateOfBirth: string;
  totalBookings: number;
  lifetimeValue: number;
  lastBookingDate: string | null;
  bookings: Array<{
    id: string;
    bookingCode: string;
    packageName: string;
    tripDate: string;
    status: 'confirmed' | 'completed' | 'cancelled';
    amount: number;
  }>;
};

export function CustomerDetailClient({ customerId, locale }: { customerId: string; locale: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/customers/${customerId}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      const data = (await res.json()) as CustomerDetail;
      setCustomer(data);
    } catch (error) {
      logger.error('Failed to load customer', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Customer tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={customer.name}
        description="Detail informasi customer"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/partner/customers`}>
                <ArrowLeft className="mr-1 h-3 w-3" />
                Kembali
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-4 pb-20">
        {/* Stats Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Total Bookings</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">{customer.totalBookings}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Lifetime Value</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-green-700">
                {formatCurrency(customer.lifetimeValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">Informasi Kontak</h3>
            <InfoCard label="Email" value={customer.email} icon={Mail} orientation="horizontal" />
            <InfoCard label="Telepon" value={customer.phone} icon={Phone} orientation="horizontal" />
            <InfoCard
              label="Alamat"
              value={`${customer.address}, ${customer.city}`}
              icon={MapPin}
              orientation="horizontal"
            />
            <InfoCard
              label="Tanggal Lahir"
              value={new Date(customer.dateOfBirth).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              icon={Calendar}
              orientation="horizontal"
            />
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold text-foreground">Riwayat Booking</h3>
            {customer.bookings.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">Belum ada booking</p>
            ) : (
              <div className="space-y-3">
                {customer.bookings.map((booking) => (
                  <Card key={booking.id} className="shadow-sm">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {booking.bookingCode}
                          </p>
                          <p className="text-xs text-muted-foreground">{booking.packageName}</p>
                        </div>
                        <StatusBadge status={booking.status} variant="pill" />
                      </div>
                      <div className="flex items-center justify-between border-t pt-2 text-xs">
                        <span className="text-muted-foreground">
                          {new Date(booking.tripDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(booking.amount)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 p-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

