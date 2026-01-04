/**
 * Package Recommendations Component
 * Shows "You May Also Like" and "Similar Packages" sections
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { MapPin, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type RecommendedPackage = {
  id: string;
  name: string;
  destination: string;
  province: string;
  durationDays: number;
  durationNights: number;
  thumbnailUrl: string | null;
  packageType: string;
  baseNTAPrice: number | null;
  priceRange: {
    nta: {
      min: number;
      max: number;
    };
  };
  similarityScore: number;
};

type PackageRecommendationsProps = {
  packageId: string;
  locale: string;
  limit?: number;
};

export function PackageRecommendations({
  packageId,
  locale,
  limit = 5,
}: PackageRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [packageId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/partner/packages/recommendations?packageId=${packageId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const data = (await response.json()) as { recommendations: RecommendedPackage[] };
      setRecommendations(data.recommendations || []);
    } catch (error) {
      logger.error('Failed to load package recommendations', error, {
        packageId,
      });
      // Don't show error toast - recommendations are optional
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show loading state for recommendations
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">You May Also Like</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/${locale}/partner/packages/${pkg.id}`}
              className="block"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                    {pkg.thumbnailUrl ? (
                      <Image
                        src={pkg.thumbnailUrl}
                        alt={pkg.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-primary/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {pkg.destination}
                    </div>

                    <h4 className="font-semibold line-clamp-2">{pkg.name}</h4>

                    <div className="text-sm text-muted-foreground">
                      {pkg.durationDays}H {pkg.durationNights}M
                    </div>

                    <div className="text-lg font-bold text-primary">
                      {pkg.priceRange.nta.min === pkg.priceRange.nta.max
                        ? formatCurrency(pkg.priceRange.nta.min)
                        : `${formatCurrency(pkg.priceRange.nta.min)} - ${formatCurrency(pkg.priceRange.nta.max)}`}
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

