/**
 * Featured Packages Carousel - Horizontal scrollable package cards
 * Showcase best-selling packages dengan quick book action
 */

'use client';

import { ArrowRight, MapPin, Calendar, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/partner/package-utils';

type FeaturedPackage = {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  thumbnailUrl: string | null;
  baseNTAPrice: number;
  basePublishPrice: number;
  commissionRate: number;
  bookingCount: number;
};

type FeaturedPackagesCarouselProps = {
  packages: FeaturedPackage[];
  loading?: boolean;
};

export function FeaturedPackagesCarousel({
  packages,
  loading = false,
}: FeaturedPackagesCarouselProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleQuickBook = (packageId: string) => {
    router.push(`/${locale}/partner/bookings/new?packageId=${packageId}`);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto scrollbar-hide -mx-4">
        <div className="flex gap-3 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada paket tersedia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4">
      <div className="flex gap-3 px-4 pb-2">
        {packages.map((pkg) => (
          <PackageCardCompact
            key={pkg.id}
            package={pkg}
            locale={locale}
            onQuickBook={() => handleQuickBook(pkg.id)}
          />
        ))}
      </div>
    </div>
  );
}

type PackageCardCompactProps = {
  package: FeaturedPackage;
  locale: string;
  onQuickBook: () => void;
};

function PackageCardCompact({
  package: pkg,
  locale,
  onQuickBook,
}: PackageCardCompactProps) {
  const margin = pkg.basePublishPrice - pkg.baseNTAPrice;

  return (
    <Card className="w-64 flex-shrink-0 overflow-hidden transition-all hover:shadow-md">
      {/* Image */}
      <Link href={`/${locale}/partner/packages/${pkg.id}`}>
        <div className="relative h-36 w-full bg-muted">
          {pkg.thumbnailUrl ? (
            <Image
              src={pkg.thumbnailUrl}
              alt={pkg.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 256px, 256px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {/* Booking count badge */}
          {pkg.bookingCount > 0 && (
            <Badge className="absolute right-2 top-2 bg-blue-600 text-white">
              <TrendingUp className="mr-1 h-3 w-3" />
              {pkg.bookingCount} booking
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Package Name */}
        <Link href={`/${locale}/partner/packages/${pkg.id}`}>
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] font-semibold text-sm leading-tight hover:text-primary">
            {pkg.name}
          </h3>
        </Link>

        {/* Details */}
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{pkg.destination}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span>
              {pkg.durationDays}D{pkg.durationNights}N
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-3 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Harga NTA</span>
            <span className="font-semibold text-sm text-primary">
              {formatCurrency(pkg.baseNTAPrice)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Komisi</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-green-600">
                {formatCurrency(margin)}
              </span>
              <Badge
                variant="secondary"
                className="bg-green-500/15 text-[10px] text-green-700 dark:text-green-400"
              >
                {pkg.commissionRate}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Book Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickBook();
          }}
          className="h-9 w-full gap-1.5 bg-blue-50 text-primary hover:bg-blue-100 active:scale-[0.98]"
          variant="secondary"
        >
          Quick Book
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}

function PackageCardSkeleton() {
  return (
    <Card className="w-64 flex-shrink-0 overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-10 w-full" />
        <div className="mb-3 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mb-3 space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
