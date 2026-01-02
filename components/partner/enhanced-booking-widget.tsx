/**
 * Enhanced Booking Widget
 * Sticky sidebar with date picker, pax counter, dynamic pricing, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  CalendarIcon,
  Users,
  Minus,
  Plus,
  TrendingUp,
  Shield,
  Zap,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type PricingTier = {
  minPax: number;
  maxPax: number;
  ntaPrice: number;
  publishPrice: number;
  margin: number;
};

type EnhancedBookingWidgetProps = {
  packageId: string;
  packageName: string;
  pricingTiers: PricingTier[];
  minPax: number;
  maxPax: number;
  isInstantConfirm?: boolean;
  locale: string;
  className?: string;
};

export function EnhancedBookingWidget({
  packageId,
  packageName,
  pricingTiers,
  minPax,
  maxPax,
  isInstantConfirm = true,
  locale,
  className,
}: EnhancedBookingWidgetProps) {
  const router = useRouter();
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [adults, setAdults] = useState(minPax || 2);
  const [children, setChildren] = useState(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message?: string;
  } | null>(null);

  const totalPax = adults + children;
  const isValidPax = totalPax >= minPax && totalPax <= maxPax;

  // Find applicable pricing tier based on total pax
  const applicableTier = pricingTiers.find(
    (tier) => totalPax >= tier.minPax && totalPax <= tier.maxPax
  ) || pricingTiers[0];

  const ntaPerPax = applicableTier?.ntaPrice || 0;
  const publishPerPax = applicableTier?.publishPrice || 0;
  const marginPerPax = publishPerPax - ntaPerPax;
  const marginPercent = ntaPerPax > 0 ? (marginPerPax / ntaPerPax) * 100 : 0;

  const totalNTA = ntaPerPax * totalPax;
  const totalMargin = marginPerPax * totalPax;

  // Check availability when date changes
  useEffect(() => {
    if (departureDate) {
      checkAvailability();
    }
  }, [departureDate, totalPax]);

  const checkAvailability = async () => {
    if (!departureDate) return;

    setIsCheckingAvailability(true);
    try {
      const dateStr = format(departureDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/partner/packages/${packageId}/availability?date=${dateStr}&pax=${totalPax}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailabilityStatus({
          available: data.available,
          message: data.available 
            ? `✅ Tersedia ${data.availableSlots || 0} slot`
            : '❌ Tidak tersedia untuk tanggal ini',
        });
      } else {
        setAvailabilityStatus({ available: false, message: 'Gagal memeriksa ketersediaan' });
      }
    } catch (error) {
      setAvailabilityStatus({ available: false, message: 'Gagal memeriksa ketersediaan' });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleIncrement = (type: 'adults' | 'children') => {
    if (type === 'adults') {
      if (totalPax < maxPax) setAdults((prev) => prev + 1);
    } else {
      if (totalPax < maxPax) setChildren((prev) => prev + 1);
    }
  };

  const handleDecrement = (type: 'adults' | 'children') => {
    if (type === 'adults') {
      if (adults > 1) setAdults((prev) => prev - 1);
    } else {
      if (children > 0) setChildren((prev) => prev - 1);
    }
  };

  const handleBookNow = () => {
    if (!departureDate) {
      toast.error('Pilih tanggal keberangkatan terlebih dahulu');
      return;
    }
    if (!isValidPax) {
      toast.error(`Jumlah peserta harus antara ${minPax} - ${maxPax} orang`);
      return;
    }

    const params = new URLSearchParams({
      packageId,
      date: format(departureDate, 'yyyy-MM-dd'),
      adults: adults.toString(),
      children: children.toString(),
    });

    router.push(`/${locale}/partner/bookings/new?${params}`);
  };

  const handleWhatsAppShare = () => {
    const message = `Halo! Saya tertarik dengan paket wisata:\n\n*${packageName}*\n\nTanggal: ${departureDate ? format(departureDate, 'dd MMMM yyyy', { locale: localeId }) : 'Belum dipilih'}\nJumlah Peserta: ${totalPax} orang (${adults} dewasa, ${children} anak)\nHarga NTA: IDR ${totalNTA.toLocaleString('id-ID')}\n\nBisakah dibantu?`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/partner/packages/${packageId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: packageName,
          text: `Cek paket wisata ${packageName}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link paket berhasil disalin');
    }
  };

  return (
    <Card className={cn('sticky top-24', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Booking Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Tanggal Keberangkatan
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !departureDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {departureDate ? (
                  format(departureDate, 'dd MMMM yyyy', { locale: localeId })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Pax Counter */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Jumlah Peserta
          </label>
          <div className="space-y-3">
            {/* Adults */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Dewasa</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDecrement('adults')}
                  disabled={adults <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{adults}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleIncrement('adults')}
                  disabled={totalPax >= maxPax}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Children */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Anak-anak</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDecrement('children')}
                  disabled={children <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{children}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleIncrement('children')}
                  disabled={totalPax >= maxPax}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Min: {minPax} pax • Max: {maxPax} pax
            </p>
          </div>
        </div>

        <Separator />

        {/* Availability Status */}
        {departureDate && availabilityStatus && (
          <div
            className={cn(
              'text-xs p-2 rounded-md',
              availabilityStatus.available
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            )}
          >
            {availabilityStatus.message}
          </div>
        )}

        {/* Pricing Summary */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Harga NTA per pax:</span>
            <span className="font-semibold">
              IDR {ntaPerPax.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total pax:</span>
            <span className="font-semibold">{totalPax} orang</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total NTA</p>
              <p className="text-2xl font-bold text-primary">
                IDR {totalNTA.toLocaleString('id-ID')}
              </p>
            </div>
            <Badge className="bg-green-600 text-white gap-1 px-3 py-1">
              <TrendingUp className="h-3 w-3" />
              Komisi {marginPercent.toFixed(0)}%
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Potensi komisi: IDR {totalMargin.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-2">
          {isInstantConfirm && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Konfirmasi Instant
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Pembayaran Aman
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-0">
        <Button
          onClick={handleBookNow}
          className="w-full font-semibold shadow-md"
          size="lg"
          disabled={!departureDate || !isValidPax || isCheckingAvailability}
        >
          Buat Booking Sekarang
        </Button>
        
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

