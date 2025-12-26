/**
 * Similar Packages Carousel
 * Horizontal scrollable carousel showing related packages
 */

'use client';

import { useEffect, useState } from 'react';
import { PackageCardEnhanced, type PackageSummary } from '@/components/partner/package-card-enhanced';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type SimilarPackagesCarouselProps = {
  packageId: string;
  locale: string;
};

export function SimilarPackagesCarousel({
  packageId,
  locale,
}: SimilarPackagesCarouselProps) {
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchSimilarPackages();
  }, [packageId]);

  const fetchSimilarPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/partner/packages/${packageId}/similar?limit=8`
      );

      if (!response.ok) throw new Error('Failed to fetch similar packages');

      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      logger.error('Failed to fetch similar packages', error);
      toast.error('Gagal memuat paket serupa');
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('similar-packages-scroll');
    if (!container) return;

    const scrollAmount = 400;
    const newPosition =
      direction === 'left'
        ? scrollPosition - scrollAmount
        : scrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });

    setScrollPosition(newPosition);
  };

  if (loading) {
    return <SimilarPackagesSkeleton />;
  }

  if (packages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paket Serupa yang Mungkin Anda Suka</h2>
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={scrollPosition <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        id="similar-packages-scroll"
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(209 213 219) rgb(243 244 246)',
        }}
      >
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex-shrink-0 w-[320px] md:w-[360px]"
          >
            <PackageCardEnhanced
              package={pkg}
              locale={locale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SimilarPackagesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-6 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex-shrink-0 w-[320px] md:w-[360px]">
            <Skeleton className="aspect-[4/3] w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

