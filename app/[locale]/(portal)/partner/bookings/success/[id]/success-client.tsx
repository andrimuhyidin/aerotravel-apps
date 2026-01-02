/**
 * Booking Success Screen
 * 
 * Features:
 * - Celebration animation
 * - Booking summary
 * - Share to WhatsApp/Email
 * - Quick actions
 * - Upsell recommendations
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Share2,
  Download,
  Home,
  Package,
  Calendar,
  Users,
  MapPin,
  Copy,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { formatCurrency } from '@/lib/partner/package-utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

type SuccessClientProps = {
  locale: string;
  bookingId: string;
};

type BookingData = {
  bookingCode: string;
  packageName: string;
  destination: string;
  tripDate: string;
  customerName: string;
  totalPax: number;
  totalAmount: number;
  commission: number;
  status: string;
};

export function SuccessClient({ locale, bookingId }: SuccessClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}`);
      if (!res.ok) throw new Error('Failed to load booking');
      const data = await res.json();
      
      if (data.booking) {
        setBooking({
          bookingCode: data.booking.booking_code || bookingId,
          packageName: data.booking.package?.name || 'Paket Wisata',
          destination: data.booking.package?.destination || '-',
          tripDate: data.booking.trip_date || new Date().toISOString(),
          customerName: data.booking.customer?.name || data.booking.customer_name || 'Customer',
          totalPax: data.booking.total_pax || 1,
          totalAmount: data.booking.total_amount || 0,
          commission: data.booking.commission_amount || 0,
          status: data.booking.status || 'pending',
        });
      }
    } catch (error) {
      logger.error('Failed to load booking', error, { bookingId });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBookingCode = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.bookingCode);
      toast.success('Kode booking disalin!');
    }
  };

  const handleShareWhatsApp = () => {
    if (!booking) return;

    const message = `✅ Booking Berhasil!

Kode Booking: *${booking.bookingCode}*
Paket: ${booking.packageName}
Destinasi: ${booking.destination}
Tanggal: ${format(new Date(booking.tripDate), 'd MMMM yyyy', { locale: localeId })}
Peserta: ${booking.totalPax} orang
Total: ${formatCurrency(booking.totalAmount)}

Terima kasih telah mempercayakan perjalanan Anda kepada kami! 🎉`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    if (!booking) return;

    const subject = `Booking Confirmed - ${booking.bookingCode}`;
    const body = `Booking berhasil dibuat!

Kode Booking: ${booking.bookingCode}
Paket: ${booking.packageName}
Destinasi: ${booking.destination}
Tanggal: ${format(new Date(booking.tripDate), 'd MMMM yyyy', { locale: localeId })}
Peserta: ${booking.totalPax} orang
Total: ${formatCurrency(booking.totalAmount)}

Terima kasih!`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Booking tidak ditemukan</p>
          <Button asChild>
            <Link href={`/${locale}/partner/bookings`}>Kembali ke Daftar Booking</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 pb-20">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white mb-4 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Berhasil!</h1>
          <p className="text-sm text-green-100">
            Booking telah dikonfirmasi dan disimpan
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 space-y-4">
        {/* Booking Code Card */}
        <Card className="border-2 border-green-200 shadow-lg">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 text-center">
              Kode Booking
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-center">{booking.bookingCode}</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopyBookingCode}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="default" className="w-full mt-2 justify-center bg-green-600">
              {booking.status === 'confirmed' ? 'TERKONFIRMASI' : 'PENDING'}
            </Badge>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-sm mb-3">Ringkasan Booking</h2>
            
            <div className="flex items-start gap-3 pb-3 border-b">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Paket Wisata</p>
                <p className="font-semibold text-sm">{booking.packageName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destinasi</p>
                <p className="font-semibold text-sm">{booking.destination}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Tanggal Keberangkatan</p>
                <p className="font-semibold text-sm">
                  {format(new Date(booking.tripDate), 'EEEE, d MMMM yyyy', {
                    locale: localeId,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Pemesan & Peserta</p>
                <p className="font-semibold text-sm">
                  {booking.customerName} • {booking.totalPax} orang
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Transaksi</span>
                <span className="font-bold">{formatCurrency(booking.totalAmount)}</span>
              </div>
              {booking.commission > 0 && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-green-600 font-medium">Komisi Anda</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(booking.commission)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Share Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-3">Bagikan ke Customer</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-2"
                onClick={handleShareWhatsApp}
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col gap-2"
                onClick={handleShareEmail}
              >
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/partner/bookings/${bookingId}`}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Link>
          </Button>
          
          <Button asChild variant="default" className="w-full bg-green-600 hover:bg-green-700">
            <Link href={`/${locale}/partner/bookings/new`}>
              <Package className="mr-2 h-4 w-4" />
              Buat Booking Lagi
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href={`/${locale}/partner/dashboard`}>
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

