/**
 * Package Comparison Client Component
 * Side-by-side comparison table
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  MapPin,
  Package,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ComparisonPackage = {
  id: string;
  name: string;
  description: string | null;
  destination: string;
  province: string;
  durationDays: number;
  durationNights: number;
  minPax: number;
  maxPax: number;
  packageType: string;
  inclusions: string[];
  exclusions: string[];
  thumbnailUrl: string | null;
  meetingPoint: string | null;
  pricing: {
    minNTA: number;
    maxNTA: number;
    margin: number;
    tiers: Array<{
      minPax: number;
      maxPax: number;
      ntaPrice: number;
      publishPrice: number;
      margin: number;
    }>;
  };
  popularity: {
    booking_count: number;
    total_revenue: number;
    popularity_score: number;
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      '5': number;
      '4': number;
      '3': number;
      '2': number;
      '1': number;
    };
  };
  availability: {
    status: 'available' | 'limited' | 'sold_out';
    nextAvailableDate: string | null;
    availableDatesCount: number;
  };
};

type ComparisonResponse = {
  packages: ComparisonPackage[];
};

export function CompareClient({
  locale,
  packageIds,
}: {
  locale: string;
  packageIds: string[];
}) {
  const [packages, setPackages] = useState<ComparisonPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, [packageIds.join(',')]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/partner/packages/compare?ids=${packageIds.join(',')}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memuat data perbandingan');
      }

      const data = (await response.json()) as ComparisonResponse;
      setPackages(data.packages);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Gagal memuat data perbandingan. Silakan refresh halaman.';

      logger.error('Failed to load comparison', error, {
        packageIds,
      });

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 px-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-6 px-4">
        <ErrorState
          title="Gagal Memuat Perbandingan"
          message={error}
          onRetry={loadComparison}
        />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="space-y-6 py-6 px-4">
        <EmptyState
          icon={Package}
          title="Tidak ada paket untuk dibandingkan"
          description="Pilih 1-3 paket untuk membandingkan fitur dan harga"
          action={
            <Button asChild>
              <Link href={`/${locale}/partner/packages`}>
                Kembali ke Daftar Paket
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Find best values for highlighting
  const bestPrice = Math.min(...packages.map((p) => p.pricing.minNTA));
  const bestMargin = Math.max(...packages.map((p) => p.pricing.margin));
  const bestRating = Math.max(
    ...packages.map((p) => p.ratings.averageRating)
  );
  const bestAvailability = packages.some(
    (p) => p.availability.status === 'available'
  );

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Bandingkan Paket
          </h1>
          <p className="text-muted-foreground">
            Bandingkan {packages.length} paket untuk menemukan yang terbaik
          </p>
        </div>
        <Link href={`/${locale}/partner/packages`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <Card>
          <CardContent className="p-0">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold">Fitur</th>
                    {packages.map((pkg) => (
                      <th key={pkg.id} className="p-4 text-center min-w-[250px]">
                        <div className="space-y-2">
                          {pkg.thumbnailUrl && (
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                              <Image
                                src={pkg.thumbnailUrl}
                                alt={pkg.name}
                                fill
                                className="object-cover"
                                sizes="250px"
                              />
                            </div>
                          )}
                          <h3 className="font-bold text-lg">{pkg.name}</h3>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {pkg.destination}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Harga NTA</td>
                    {packages.map((pkg) => (
                      <td
                        key={pkg.id}
                        className={cn(
                          'p-4 text-center',
                          pkg.pricing.minNTA === bestPrice &&
                            'bg-green-50 font-semibold'
                        )}
                      >
                        {pkg.pricing.minNTA === pkg.pricing.maxNTA ? (
                          formatCurrency(pkg.pricing.minNTA)
                        ) : (
                          <div>
                            <div>{formatCurrency(pkg.pricing.minNTA)}</div>
                            <div className="text-xs text-muted-foreground">
                              - {formatCurrency(pkg.pricing.maxNTA)}
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Margin */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Margin per Pax</td>
                    {packages.map((pkg) => (
                      <td
                        key={pkg.id}
                        className={cn(
                          'p-4 text-center',
                          pkg.pricing.margin === bestMargin &&
                            'bg-green-50 font-semibold'
                        )}
                      >
                        {formatCurrency(pkg.pricing.margin)}
                      </td>
                    ))}
                  </tr>

                  {/* Duration */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Durasi</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-center">
                        {pkg.durationDays}H {pkg.durationNights}M
                      </td>
                    ))}
                  </tr>

                  {/* Pax Range */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Jumlah Pax</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-center">
                        {pkg.minPax}-{pkg.maxPax} pax
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Rating</td>
                    {packages.map((pkg) => (
                      <td
                        key={pkg.id}
                        className={cn(
                          'p-4 text-center',
                          pkg.ratings.averageRating === bestRating &&
                            pkg.ratings.totalReviews > 0 &&
                            'bg-green-50 font-semibold'
                        )}
                      >
                        {pkg.ratings.totalReviews > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i < Math.round(pkg.ratings.averageRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  )}
                                />
                              ))}
                            </div>
                            <div className="text-sm font-semibold">
                              {pkg.ratings.averageRating.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({pkg.ratings.totalReviews} reviews)
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Availability */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Ketersediaan</td>
                    {packages.map((pkg) => (
                      <td
                        key={pkg.id}
                        className={cn(
                          'p-4 text-center',
                          pkg.availability.status === 'available' &&
                            bestAvailability &&
                            'bg-green-50 font-semibold'
                        )}
                      >
                        <div
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold',
                            pkg.availability.status === 'available' &&
                              'bg-green-500 text-white',
                            pkg.availability.status === 'limited' &&
                              'bg-yellow-500 text-white',
                            pkg.availability.status === 'sold_out' &&
                              'bg-red-500 text-white'
                          )}
                        >
                          {pkg.availability.status === 'available' && 'Available'}
                          {pkg.availability.status === 'limited' && 'Limited'}
                          {pkg.availability.status === 'sold_out' && 'Sold Out'}
                        </div>
                        {pkg.availability.availableDatesCount > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {pkg.availability.availableDatesCount} tanggal tersedia
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Popularity */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Popularitas</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {pkg.popularity.popularity_score.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pkg.popularity.booking_count} bookings
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Inclusions */}
                  <tr className="border-b">
                    <td className="p-4 font-medium">Inclusions</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4">
                        <ul className="space-y-1 text-sm">
                          {pkg.inclusions.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{item}</span>
                            </li>
                          ))}
                          {pkg.inclusions.length > 5 && (
                            <li className="text-xs text-muted-foreground">
                              +{pkg.inclusions.length - 5} lebih
                            </li>
                          )}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="p-4"></td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="p-4">
                        <div className="space-y-2">
                          <Link
                            href={`/${locale}/partner/packages/${pkg.id}`}
                            className="block"
                          >
                            <Button variant="outline" className="w-full" size="sm">
                              Lihat Detail
                            </Button>
                          </Link>
                          <Link
                            href={`/${locale}/partner/bookings/new?packageId=${pkg.id}`}
                            className="block"
                          >
                            <Button className="w-full" size="sm">
                              Book Now
                            </Button>
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

