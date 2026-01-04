/**
 * Enhanced Package Card Component
 * Improved visual hierarchy with facilities, badges, wishlist, and quick view
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Package as PackageIcon,
  Star,
  Share2,
  Heart,
  Zap,
  Sparkles,
  TrendingUp,
  Eye,
  Utensils,
  BedDouble,
  Bus,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

export type PackageSummary = {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  thumbnailUrl: string | null;
  baseNTAPrice: number | null;
  basePublishPrice: number | null;
  margin: number;
  priceRange: {
    nta: { min: number; max: number };
    publish: { min: number; max: number };
  };
  facilities?: string[];
  ratings?: {
    averageRating: number;
    totalReviews: number;
  };
  popularity?: {
    booking_count: number;
    total_revenue: number;
    popularity_score: number;
  };
  availability?: {
    status: 'available' | 'limited' | 'sold_out';
    nextAvailableDate: string | null;
    availableDatesCount: number;
  };
};

type PackageCardEnhancedProps = {
  package: PackageSummary;
  locale: string;
  onQuickView?: (packageId: string) => void;
  onWishlistToggle?: (packageId: string) => void;
  isWishlisted?: boolean;
};

const FACILITY_ICONS: Record<string, { icon: any; label: string }> = {
  meals: { icon: Utensils, label: 'Makanan' },
  hotel: { icon: BedDouble, label: 'Hotel' },
  transport: { icon: Bus, label: 'Transport' },
};

export function PackageCardEnhanced({
  package: pkg,
  locale,
  onQuickView,
  onWishlistToggle,
  isWishlisted = false,
}: PackageCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(isWishlisted);

  const minNTAPrice = pkg.priceRange.nta.min || pkg.baseNTAPrice || 0;
  const avgMargin = pkg.margin || 0;
  const rating = pkg.ratings?.averageRating || 0;
  const reviewCount = pkg.ratings?.totalReviews || 0;
  const bookingCount = pkg.popularity?.booking_count || 0;
  const isInstant = pkg.availability?.status === 'available';
  const isBestSeller = bookingCount > 50;
  const isHotDeal = avgMargin > 30;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/${locale}/partner/packages/${pkg.id}`;

    if (navigator.share) {
      navigator.share({
        title: pkg.name,
        text: `Cek paket wisata ${pkg.name} di ${pkg.destination}!`,
        url: url,
      }).catch((err) => logger.error('Share failed', err));
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link paket berhasil disalin');
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistActive(!wishlistActive);
    onWishlistToggle?.(pkg.id);
    toast.success(wishlistActive ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist');
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(pkg.id);
  };

  return (
    <Link
      href={`/${locale}/partner/packages/${pkg.id}`}
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'h-full overflow-hidden transition-all duration-300 flex flex-col',
          'hover:shadow-xl hover:border-primary/30 hover:-translate-y-1'
        )}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {pkg.thumbnailUrl ? (
            <Image
              src={pkg.thumbnailUrl}
              alt={pkg.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <PackageIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {isInstant && (
              <Badge className="bg-blue-600 text-white font-semibold shadow-md">
                <Zap className="mr-1 h-3 w-3 fill-white" />
                Instant
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-amber-600 text-white font-semibold shadow-md">
                <Sparkles className="mr-1 h-3 w-3 fill-white" />
                Best Seller
              </Badge>
            )}
            {isHotDeal && (
              <Badge className="bg-red-600 text-white font-semibold shadow-md">
                <TrendingUp className="mr-1 h-3 w-3" />
                Hot Deal
              </Badge>
            )}
          </div>

          {/* Action Buttons (Top Right) */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              onClick={handleWishlist}
              className={cn(
                'rounded-full p-2 shadow-md backdrop-blur-sm transition-all',
                wishlistActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
              )}
              aria-label="Save to wishlist"
            >
              <Heart className={cn('h-4 w-4', wishlistActive && 'fill-white')} />
            </button>
            <button
              onClick={handleShare}
              className="rounded-full bg-white/90 p-2 text-gray-600 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-primary"
              aria-label="Share package"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Quick View Button (Hover) */}
          {onQuickView && (
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 p-4 transition-all duration-300',
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              )}
            >
              <Button
                onClick={handleQuickView}
                variant="secondary"
                size="sm"
                className="w-full gap-2 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white"
              >
                <Eye className="h-4 w-4" />
                Quick View
              </Button>
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4 space-y-3">
          {/* Meta Info: Duration & Rating */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">
                {pkg.durationDays}D{pkg.durationNights}N
              </span>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount})</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-base font-bold text-foreground leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
            {pkg.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{pkg.destination}</span>
          </div>

          {/* Facilities Icons */}
          {pkg.facilities && pkg.facilities.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              {pkg.facilities.slice(0, 3).map((facility) => {
                const config = FACILITY_ICONS[facility];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div
                    key={facility}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    title={config.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Booking Count (if significant) */}
          {bookingCount > 10 && (
            <div className="text-xs text-muted-foreground">
              🔥 Terjual <span className="font-semibold text-foreground">{bookingCount}+</span> kali
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-3 border-t bg-gray-50/50">
          {/* Pricing Info */}
          <div className="w-full space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                  Harga NTA Mulai
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-primary">IDR</span>
                  <span className="text-xl font-bold text-foreground">
                    {minNTAPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 font-semibold px-2.5 py-1"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {avgMargin.toFixed(0)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full gap-2 font-semibold shadow-sm group-hover:shadow-md"
            size="sm"
          >
            Lihat Detail
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

