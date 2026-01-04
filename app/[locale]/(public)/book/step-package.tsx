/**
 * Step 1: Package Selection for Public Booking
 */

'use client';

import { Clock, MapPin, Package, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type PackageData = {
  id: string;
  slug: string;
  name: string;
  destination: string;
  province: string;
  duration: { days: number; nights: number; label: string };
  thumbnailUrl?: string;
  rating?: number;
  reviewCount?: number;
  pricing: {
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
  };
  minPax: number;
  maxPax: number;
  inclusions: string[];
  exclusions: string[];
};

type StepPackagePublicProps = {
  packageData: PackageData | null;
  onPackageSelect: (pkg: PackageData | null) => void;
  loading?: boolean;
};

export function StepPackagePublic({
  packageData,
  onPackageSelect,
  loading = false,
}: StepPackagePublicProps) {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/public/packages?limit=10');
      if (!res.ok) throw new Error('Failed to load packages');
      
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (error) {
      logger.error('Failed to load packages', error);
      toast.error('Gagal memuat daftar paket');
    } finally {
      setLoadingPackages(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Package Display */}
      {packageData ? (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paket Dipilih</p>
                <h3 className="font-bold text-sm">{packageData.name}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {packageData.destination}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {packageData.duration.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {packageData.minPax}-{packageData.maxPax} orang
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Mulai dari</p>
                <p className="text-lg font-bold text-primary">
                  Rp {packageData.pricing.adultPrice.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-muted-foreground">/orang</span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPackageSelect(null)}
              >
                Ganti Paket
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Package Selection Prompt */}
          <div className="text-center py-4">
            <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-bold text-lg mb-1">Pilih Paket Wisata</h2>
            <p className="text-sm text-muted-foreground">
              Pilih salah satu paket wisata untuk melanjutkan booking
            </p>
          </div>

          {/* Package List */}
          <div className="space-y-3">
            {loadingPackages ? (
              <>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </>
            ) : packages.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">Tidak ada paket tersedia</p>
                <Link href="/id/packages">
                  <Button variant="link" className="mt-2">
                    Lihat semua paket
                  </Button>
                </Link>
              </Card>
            ) : (
              packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.99]"
                  onClick={() => onPackageSelect(pkg)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Thumbnail Placeholder */}
                      <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                        <span className="text-3xl">🏝️</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{pkg.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {pkg.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {pkg.duration.label}
                          </Badge>
                          <div className="flex items-center gap-0.5 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{(pkg.rating || 0).toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-primary mt-2">
                          Rp {pkg.pricing.adultPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Browse All Packages Link */}
          <div className="text-center pt-2">
            <Link href="/id/packages">
              <Button variant="ghost" className="text-sm">
                Lihat Semua Paket →
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

