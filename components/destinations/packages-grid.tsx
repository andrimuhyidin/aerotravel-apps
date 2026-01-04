/**
 * Packages Grid Component
 * Displays packages related to a destination
 */

'use client';

import { MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import queryKeys from '@/lib/queries/query-keys';

type PackagesGridProps = {
  destinationName: string;
  locale: string;
};

type Package = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  duration: { days: number; nights: number };
  thumbnailUrl?: string;
  pricing: { adultPrice: number };
  minPax: number;
  maxPax: number;
};

export function PackagesGrid({ destinationName, locale }: PackagesGridProps) {
  const { data: packages, isLoading } = useQuery<Package[]>({
    queryKey: queryKeys.packages.byDestination(destinationName),
    queryFn: async () => {
      const res = await fetch(
        `/api/public/packages?destination=${encodeURIComponent(destinationName)}&limit=6`
      );
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      return data.packages || [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="rounded-2xl bg-muted p-8 text-center">
        <p className="text-muted-foreground">
          Belum ada paket tersedia untuk destinasi ini
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <Link
          key={pkg.id}
          href={`/${locale}/packages/detail/${pkg.slug}`}
          className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg dark:bg-slate-800"
        >
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 to-blue-500/20">
            <div className="flex h-full items-center justify-center text-6xl">
              📸
            </div>
            {/* Duration Badge */}
            <div className="absolute right-3 top-3">
              <Badge variant="secondary" className="bg-white/95 backdrop-blur">
                {pkg.duration.days}D{pkg.duration.nights}N
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="mb-2 line-clamp-2 font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {pkg.name}
            </h3>

            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{pkg.destination}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mulai dari</p>
                <p className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(pkg.pricing.adultPrice)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {pkg.minPax}-{pkg.maxPax} pax
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

