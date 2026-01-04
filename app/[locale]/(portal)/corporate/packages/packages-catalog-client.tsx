/**
 * Corporate Packages Catalog Client Component
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type PackageItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  destination: string;
  packageType: string;
  duration: string;
  durationDays: number;
  durationNights: number;
  minPax: number;
  maxPax: number;
  pricePerAdult: number;
  pricePerChild: number;
  includes: string[];
  highlights: string[];
  mainImage: string | null;
  galleryImages: string[];
};

type PackagesResponse = {
  packages: PackageItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

type PackagesCatalogClientProps = {
  locale: string;
};

export function PackagesCatalogClient({ locale }: PackagesCatalogClientProps) {
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch packages
  const { data, isLoading, isFetching, error, refetch } = useQuery<PackagesResponse>({
    queryKey: queryKeys.corporate.packages.list(search, destination, page),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (destination) params.set('destination', destination);

      const response = await apiClient.get(
        `/api/partner/corporate/packages?${params}`
      );
      return response.data as PackagesResponse;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getPackageTypeLabel = (type: string) => {
    switch (type) {
      case 'open_trip':
        return 'Open Trip';
      case 'private_trip':
        return 'Private Trip';
      case 'corporate':
        return 'Corporate';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Katalog Paket</h1>
        <p className="text-sm text-muted-foreground">
          Pilih paket perjalanan untuk booking
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari paket..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Destinasi"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setPage(1);
          }}
          className="sm:w-40"
        />
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <p className="font-medium mb-1 text-red-600">Gagal memuat paket</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : !data?.packages.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium mb-1">Tidak ada paket tersedia</p>
            <p className="text-sm text-muted-foreground">
              Coba ubah filter pencarian
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  {pkg.mainImage ? (
                    <Image
                      src={pkg.mainImage}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-primary">
                    {getPackageTypeLabel(pkg.packageType)}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  {/* Title & Destination */}
                  <h3 className="font-semibold line-clamp-1">{pkg.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {pkg.destination}
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {pkg.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {pkg.minPax}-{pkg.maxPax} pax
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">Mulai dari</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(pkg.pricePerAdult)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /pax
                      </span>
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/corporate/bookings/new?packageId=${pkg.id}`}>
                      Booking Sekarang
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Halaman {page} dari {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore || isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

