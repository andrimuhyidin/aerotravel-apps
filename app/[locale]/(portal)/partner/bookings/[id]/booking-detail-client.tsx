/**
 * Partner Booking Detail Client Component
 * REDESIGNED - Clean sections, Timeline, Action cards, Stepper Progress
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { InfoCard } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Users,
  Phone,
  Mail,
  Package as PackageIcon,
  TrendingUp,
  Bell,
  X as XIcon,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  AlertCircle,
  Printer,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type BookingDetail = {
  id: string;
  booking_code: string;
  trip_date: string;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  total_amount: number;
  nta_total: number | null;
  status: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  package: {
    id: string;
    name: string;
    destination: string | null;
    duration_days: number;
    duration_nights: number;
  } | null;
  timeline?: Array<{
    event: string;
    timestamp: string;
    status: string;
  }>;
};

export function BookingDetailClient({
  locale,
  bookingId,
}: {
  locale: string;
  bookingId: string;
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/partner/bookings/${bookingId}`);

        if (!res.ok) {
          throw new Error('Failed to load booking');
        }

        const data = (await res.json()) as { booking: BookingDetail };
        if (mounted) {
          setBooking(data.booking);
        }
      } catch (error) {
        logger.error('Failed to load booking', error, { bookingId });
        toast.error('Gagal memuat detail booking');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if (loading) {
    return <BookingDetailSkeleton />;
  }

  if (!booking) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <EmptyState
          icon={PackageIcon}
          title="Booking tidak ditemukan"
          description="Booking yang Anda cari tidak tersedia atau telah dihapus"
          action={
            <Button asChild>
              <Link href={`/${locale}/partner/bookings`}>Kembali ke Daftar Booking</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const commission = booking.nta_total
    ? booking.total_amount - booking.nta_total
    : 0;

  // Stepper Logic
  const steps = [
    { id: 'created', label: 'Dibuat', icon: FileText },
    { id: 'paid', label: 'Dibayar', icon: CreditCard },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'completed', label: 'Selesai', icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    if (status === 'completed') return 3;
    if (status === 'confirmed') return 2;
    if (status === 'pending_payment') return 0; // or 1 if paid but not confirmed? Assuming pending payment is step 0->1
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex(booking.status);
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href={`/${locale}/partner/bookings`}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground truncate">{booking.booking_code}</h1>
                <Badge 
                  variant={
                    isCancelled ? "destructive" : 
                    booking.status === 'confirmed' || booking.status === 'completed' ? "default" : "outline"
                  }
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider shrink-0",
                    booking.status === 'confirmed' && "bg-blue-600 hover:bg-blue-700",
                    booking.status === 'completed' && "bg-green-600 hover:bg-green-700",
                    booking.status === 'pending_payment' && "text-orange-600 border-orange-200 bg-orange-50"
                  )}
                >
                  {booking.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" /> Print
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" /> Download Invoice
              </DropdownMenuItem>
              {booking.status === 'pending_payment' && (
                <DropdownMenuItem className="text-red-600">
                  <XIcon className="mr-2 h-4 w-4" /> Batalkan Booking
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        
        {/* Progress Stepper */}
        {!isCancelled && (
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50/50 px-2 rounded-lg">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-colors bg-background",
                        isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground",
                        isCurrent && "ring-4 ring-primary/20"
                      )}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium transition-colors hidden sm:block",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Booking Dibatalkan</p>
              <p className="text-sm">Pesanan ini telah dibatalkan dan tidak dapat diproses lebih lanjut.</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          
          {/* Package & Trip Info */}
          <Card>
              <CardHeader>
                <CardTitle className="text-base">Detail Perjalanan</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <InfoCard 
                  label="Paket Wisata" 
                  value={booking.package?.name || '-'} 
                  icon={PackageIcon} 
                  subValue={booking.package?.destination || undefined}
                />
                <InfoCard 
                  label="Tanggal Keberangkatan" 
                  value={new Date(booking.trip_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} 
                  icon={Calendar} 
                />
                <InfoCard 
                  label="Durasi" 
                  value={booking.package ? `${booking.package.duration_days} Hari ${booking.package.duration_nights} Malam` : '-'} 
                  icon={Clock} 
                />
                <InfoCard 
                  label="Peserta" 
                  value={`${booking.adult_pax + booking.child_pax + booking.infant_pax} Orang`} 
                  subValue={`${booking.adult_pax} Dewasa, ${booking.child_pax} Anak, ${booking.infant_pax} Bayi`}
                  icon={Users} 
                />
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Pemesan</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <InfoCard label="Nama Lengkap" value={booking.customer_name} icon={Users} />
                <InfoCard label="Nomor Telepon" value={booking.customer_phone || '-'} icon={Phone} />
                <InfoCard label="Email" value={booking.customer_email || '-'} icon={Mail} />
                <InfoCard label="Catatan" value={booking.notes || '-'} icon={FileText} />
              </CardContent>
            </Card>

            {/* Documents Section (New) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dokumen Perjalanan</CardTitle>
              </CardHeader>
              <CardContent>
                {booking.status === 'confirmed' || booking.status === 'completed' ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium">E-Ticket</p>
                        <p className="text-xs text-muted-foreground">PDF • 1.2 MB</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-orange-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium">Voucher Hotel</p>
                        <p className="text-xs text-muted-foreground">PDF • 800 KB</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    Dokumen akan tersedia setelah booking dikonfirmasi
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Pricing Card */}
          <Card className="border-primary/20 shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <p className="text-sm font-medium text-foreground">Total Tagihan</p>
                <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(booking.total_amount)}</p>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode Bayar</span>
                    <span className="font-medium capitalize">{booking.payment_method || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Bayar</span>
                    <span className={cn(
                      "font-medium",
                      booking.status === 'pending_payment' ? "text-orange-600" : "text-green-600"
                    )}>
                      {booking.status === 'pending_payment' ? 'Belum Lunas' : 'Lunas'}
                    </span>
                  </div>
                </div>

                {commission > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Potensi Komisi
                    </div>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(commission)}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50/50 p-4 flex flex-col gap-3">
                {booking.status === 'pending_payment' && (
                  <Button className="w-full" size="lg">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Konfirmasi Pembayaran
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            {booking.status === 'pending_payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <div className="bg-blue-50 p-2 rounded-full mr-3 text-blue-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">Kirim Reminder</div>
                      <div className="text-xs text-muted-foreground">Ingatkan customer via WA</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                    <div className="bg-red-50 p-2 rounded-full mr-3 text-red-600">
                      <XIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">Batalkan Pesanan</div>
                      <div className="text-xs text-muted-foreground">Booking akan hangus</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function BookingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="border-b bg-background p-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="px-4 py-6 space-y-6">
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
