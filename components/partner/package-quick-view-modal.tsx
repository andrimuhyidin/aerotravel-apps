/**
 * Package Quick View Modal
 * Shows quick preview of package with key info and quick actions
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Users,
  Star,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Utensils,
  BedDouble,
  Bus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type QuickViewPackage = {
  id: string;
  name: string;
  destination: string;
  province: string;
  duration_days: number;
  duration_nights: number;
  min_pax: number;
  thumbnailUrl: string | null;
  gallery_urls?: string[];
  inclusions: string[] | null;
  package_prices: Array<{
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
  }>;
  ratings?: {
    averageRating: number;
    totalReviews: number;
  };
  facilities?: string[];
};

type PackageQuickViewModalProps = {
  packageId: string | null;
  locale: string;
  onClose: () => void;
};

const FACILITY_LABELS: Record<string, { icon: any; label: string }> = {
  meals: { icon: Utensils, label: 'Makanan' },
  hotel: { icon: BedDouble, label: 'Hotel' },
  transport: { icon: Bus, label: 'Transport' },
};

export function PackageQuickViewModal({
  packageId,
  locale,
  onClose,
}: PackageQuickViewModalProps) {
  const [packageData, setPackageData] = useState<QuickViewPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!packageId) {
      setPackageData(null);
      return;
    }

    const fetchPackage = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/partner/packages/${packageId}`);
        if (!response.ok) throw new Error('Failed to fetch package');
        
        const data = await response.json();
        setPackageData(data.package);
      } catch (error) {
        logger.error('Failed to fetch package for quick view', error);
        toast.error('Gagal memuat detail paket');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    void fetchPackage();
  }, [packageId, onClose]);

  if (!packageId) return null;

  const images = packageData?.gallery_urls || (packageData?.thumbnailUrl ? [packageData.thumbnailUrl] : []);
  const minPrice = packageData ? Math.min(...packageData.package_prices.map(p => p.price_nta)) : 0;
  const avgMargin = packageData
    ? packageData.package_prices.reduce((acc, tier) => {
        const margin = ((tier.price_publish - tier.price_nta) / tier.price_nta) * 100;
        return acc + margin;
      }, 0) / packageData.package_prices.length
    : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={!!packageId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {loading || !packageData ? (
          <QuickViewSkeleton />
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Image Gallery */}
            <div className="relative bg-muted aspect-square md:aspect-auto">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[currentImageIndex]}
                    alt={packageData.name}
                    fill
                    className="object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              idx === currentImageIndex
                                ? 'w-6 bg-white'
                                : 'w-1.5 bg-white/50'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MapPin className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Right: Content */}
            <div className="flex flex-col max-h-[90vh] md:max-h-auto">
              {/* Header */}
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold leading-tight mb-2">
                      {packageData.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{packageData.destination}, {packageData.province}</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </DialogHeader>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {packageData.duration_days}D{packageData.duration_nights}N
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Min {packageData.min_pax} Pax</span>
                  </div>
                  {packageData.ratings && packageData.ratings.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {packageData.ratings.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({packageData.ratings.totalReviews})
                      </span>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                {packageData.facilities && packageData.facilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Fasilitas</h4>
                    <div className="flex flex-wrap gap-2">
                      {packageData.facilities.map((facility) => {
                        const config = FACILITY_LABELS[facility];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <Badge
                            key={facility}
                            variant="secondary"
                            className="gap-1.5"
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key Inclusions */}
                {packageData.inclusions && packageData.inclusions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Termasuk</h4>
                    <ul className="space-y-1.5">
                      {packageData.inclusions.slice(0, 5).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                      {packageData.inclusions.length > 5 && (
                        <li className="text-xs text-muted-foreground italic pl-6">
                          +{packageData.inclusions.length - 5} lainnya
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Pricing */}
                <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">
                        Harga NTA Mulai
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-primary">IDR</span>
                        <span className="text-2xl font-bold text-foreground">
                          {minPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Komisi {avgMargin.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 pt-4 border-t bg-gray-50/50 space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/${locale}/partner/bookings/new?packageId=${packageData.id}`}>
                    Buat Booking Sekarang
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href={`/${locale}/partner/packages/${packageData.id}`}>
                    Lihat Detail Lengkap
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-0">
      <Skeleton className="aspect-square md:aspect-auto h-full" />
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

