/**
 * Partner Bookings List Client Component
 * REDESIGNED - Grouped by status, Clean cards, Better UX
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Search,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  package: {
    id: string;
    name: string;
    destination: string | null;
  } | null;
};

type BookingsResponse = {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function BookingsListClient({ locale }: { locale: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memoize loadBookings to prevent recreating on every render
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(activeTab !== 'all' && { status: activeTab }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/partner/bookings?${params}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data: BookingsResponse = await res.json();
      setBookings(data.bookings);
    } catch (error) {
      logger.error('Failed to load bookings', error);
      toast.error('Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const statusTabs = [
    { id: 'all', label: 'Semua' },
    { id: 'pending_payment', label: 'Menunggu' },
    { id: 'confirmed', label: 'Aktif' },
    { id: 'completed', label: 'Selesai' },
    { id: 'cancelled', label: 'Batal' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-muted/30 relative">
      {/* Ultra-Compact Header - FLOATING EFFECT */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-border/40 sticky top-0 z-20 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="px-4 py-3">
          <h1 className="text-base font-bold text-foreground">Daftar Booking</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {bookings.length > 0 ? `${bookings.length} pesanan` : 'Kelola pesanan'}
          </p>
        </div>
      </div>

      {/* Compact Filter Bar - FLOATING EFFECT */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-border/40 sticky top-[45px] z-20 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="px-4 py-2.5 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari booking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs bg-white border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent overflow-x-auto hide-scrollbar gap-1.5">
              {statusTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:bg-muted/50"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content with min-height for FAB visibility */}
      <div className="px-4 py-3 pb-28 min-h-[calc(100vh-82px)]">
        {loading ? (
          <BookingsListSkeleton />
        ) : bookings.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-220px)]">
            <div className="text-center max-w-sm mx-auto px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                <Calendar className="h-10 w-10 text-primary/70" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {activeTab === 'all' ? 'Belum ada booking' : 'Tidak ada booking'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {activeTab === 'all' 
                  ? "Mulai perjalanan bisnis Anda dengan membuat booking pertama" 
                  : "Tidak ada booking dengan status ini"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Booking Card Component - ELEGANT & COMPACT VERSION
function BookingCard({ booking, locale }: { booking: Booking; locale: string }) {
  const totalPax = booking.adult_pax + booking.child_pax + booking.infant_pax;
  const commission = booking.nta_total
    ? booking.total_amount - booking.nta_total
    : 0;

  const statusConfig = {
    pending_payment: { 
      label: 'Menunggu', 
      color: 'text-orange-600 bg-orange-50/80 border-orange-200/50', 
      icon: Clock 
    },
    confirmed: { 
      label: 'Aktif', 
      color: 'text-blue-600 bg-blue-50/80 border-blue-200/50', 
      icon: CheckCircle2 
    },
    completed: { 
      label: 'Selesai', 
      color: 'text-green-600 bg-green-50/80 border-green-200/50', 
      icon: CheckCircle2 
    },
    cancelled: { 
      label: 'Batal', 
      color: 'text-red-600 bg-red-50/80 border-red-200/50', 
      icon: XCircle 
    },
  };

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending_payment;
  const StatusIcon = status.icon;

  return (
    <Link href={`/${locale}/partner/bookings/${booking.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 active:scale-[0.98] bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground truncate mb-1">
                {booking.booking_code}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {booking.package?.name || 'Paket Custom'}
              </p>
            </div>
            <Badge className={cn("shrink-0 text-[10px] font-semibold border backdrop-blur-sm", status.color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">
                {new Date(booking.trip_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{booking.package?.destination || '-'}</span>
            </div>
          </div>

          {/* Footer Row - Price & Commission */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Total</p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(booking.total_amount)}
              </p>
            </div>
            {commission > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Komisi</p>
                <p className="text-sm font-bold text-green-600">
                  +{formatCurrency(commission)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Loading Skeleton - COMPACT VERSION
function BookingsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full col-span-2" />
            </div>
            <div className="flex justify-between items-end pt-3 border-t">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
