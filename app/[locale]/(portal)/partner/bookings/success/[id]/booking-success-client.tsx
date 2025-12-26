/**
 * Booking Success Client Component
 * Interactive success screen with sharing and next actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Download,
  Share2,
  MessageCircle,
  ArrowRight,
  Package,
  Calendar,
  Users,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { formatCurrency } from '@/lib/partner/package-utils';
import confetti from 'canvas-confetti';

type BookingSuccessClientProps = {
  locale: string;
  bookingId: string;
};

type BookingData = {
  id: string;
  bookingCode: string;
  packageName: string;
  tripDate: string;
  customerName: string;
  customerPhone: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
};

export function BookingSuccessClient({
  locale,
  bookingId,
}: BookingSuccessClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load booking data
  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  // Confetti animation on mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      
      // Fetch real booking data from API
      const response = await fetch(`/api/partner/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load booking');
      }

      const data = await response.json();
      const bookingData = data.booking;

      if (!bookingData) {
        setBooking(null);
        return;
      }

      // Transform API response to BookingData format
      setBooking({
        id: bookingData.id,
        bookingCode: bookingData.booking_code || `BKG-${bookingData.id.slice(-8)}`,
        packageName: bookingData.package?.name || bookingData.package_name || 'Paket Wisata',
        tripDate: bookingData.trip_date,
        customerName: bookingData.customer_name,
        customerPhone: bookingData.customer_phone,
        adultPax: bookingData.adult_pax || 0,
        childPax: bookingData.child_pax || 0,
        infantPax: bookingData.infant_pax || 0,
        totalAmount: bookingData.total_amount || bookingData.nta_total || 0,
        paymentStatus: bookingData.payment_status || 'pending',
        status: bookingData.status || 'pending_payment',
      });
    } catch (error) {
      console.error('Failed to load booking:', error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const text = `Booking berhasil dibuat!\nKode Booking: ${booking?.bookingCode}\nPaket: ${booking?.packageName}\n\nHubungi kami untuk info lebih lanjut.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Konfirmasi Booking',
          text,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Teks berhasil disalin!');
    }
  };

  const handleWhatsApp = () => {
    if (!booking) return;

    const text = `Halo ${booking.customerName}, booking Anda telah dikonfirmasi!\n\nKode Booking: *${booking.bookingCode}*\nPaket: ${booking.packageName}\nTanggal: ${format(new Date(booking.tripDate), 'd MMMM yyyy', { locale: localeId })}\n\nTerima kasih!`;
    const url = `https://wa.me/${booking.customerPhone.replace(/^0/, '62')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat detail booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Booking tidak ditemukan</p>
          <Link href={`/${locale}/partner/bookings`}>
            <Button>Kembali ke Daftar Booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPax = booking.adultPax + booking.childPax + booking.infantPax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-32">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Success Animation */}
        <div className="text-center animate-in zoom-in duration-500">
          <div className="h-24 w-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            Booking Berhasil Dibuat!
          </h1>
          <p className="text-sm text-green-700">
            Konfirmasi telah dikirim ke customer
          </p>
        </div>

        {/* Booking Code */}
        <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Kode Booking</p>
            <p className="text-3xl font-bold text-primary tracking-wider">
              {booking.bookingCode}
            </p>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Paket Wisata</p>
                <p className="font-semibold">{booking.packageName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Tanggal Keberangkatan</p>
                <p className="font-semibold">
                  {format(new Date(booking.tripDate), 'EEEE, d MMMM yyyy', {
                    locale: localeId,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t">
              <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-semibold">{booking.customerName}</p>
                <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t">
              <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Jumlah Peserta</p>
                <p className="font-semibold">
                  {totalPax} Orang
                  <span className="text-sm text-muted-foreground ml-2">
                    ({booking.adultPax} Dewasa
                    {booking.childPax > 0 && `, ${booking.childPax} Anak`}
                    {booking.infantPax > 0 && `, ${booking.infantPax} Bayi`})
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-base">Total Pembayaran</span>
                <span className="font-bold text-2xl text-primary">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              <div className="mt-2 p-2 bg-green-50 rounded text-center">
                <p className="text-sm font-semibold text-green-700">
                  ✓ {booking.paymentStatus === 'paid' ? 'Sudah Dibayar' : 'Pending Pembayaran'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="h-12 border-2"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Bagikan
          </Button>
          <Button onClick={handleWhatsApp} className="h-12">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>

        {/* Next Actions */}
        <div className="space-y-3">
          <Link href={`/${locale}/partner/bookings/${booking.id}`}>
            <Button variant="outline" className="w-full h-12">
              Lihat Detail Booking
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <Link href={`/${locale}/partner/bookings/new`}>
            <Button variant="ghost" className="w-full h-12">
              Buat Booking Baru
            </Button>
          </Link>

          <Link href={`/${locale}/partner/dashboard`}>
            <Button variant="ghost" className="w-full h-12">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

