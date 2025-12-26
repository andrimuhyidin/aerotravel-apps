/**
 * Package Selector Sheet Component
 * Bottom sheet with searchable package list
 */

'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package as PackageIcon, MapPin, Star, TrendingUp, Users, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/partner/package-utils';

type PackageData = {
  id: string;
  name: string;
  destination: string | null;
  duration: {
    days: number;
    nights: number;
    label: string;
  };
  thumbnailUrl?: string;
  pricingTiers: Array<{
    minPax: number;
    maxPax: number;
    publishPrice: number;
    ntaPrice: number;
    margin: number;
  }>;
  ratings?: {
    average: number;
    count: number;
  };
  urgency: {
    bookingCountToday: number;
    lastBookedAt?: string;
  };
  availability: {
    status: 'high' | 'medium' | 'low';
    label: string;
  };
};

type PackageSelectorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pkg: PackageData) => void;
  selectedPackageId?: string;
};

export function PackageSelectorSheet({
  open,
  onOpenChange,
  onSelect,
  selectedPackageId,
}: PackageSelectorSheetProps) {
  const [search, setSearch] = useState('');
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(false);

  // Load packages when sheet opens
  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      // Fetch real packages from API
      const response = await fetch('/api/partner/packages?limit=50&sortBy=popularity');
      
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data = await response.json();
      const apiPackages = data.packages || [];

      // Transform API data to PackageData format
      const transformedPackages: PackageData[] = apiPackages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        destination: pkg.destination,
        duration: {
          days: pkg.durationDays,
          nights: pkg.durationNights,
          label: `${pkg.durationDays}H${pkg.durationNights}M`,
        },
        thumbnailUrl: pkg.thumbnailUrl,
        pricingTiers: (pkg.pricingTiers || []).map((tier: any) => ({
          minPax: tier.minPax,
          maxPax: tier.maxPax,
          publishPrice: tier.publishPrice,
          ntaPrice: tier.ntaPrice,
          margin: tier.margin,
        })),
        ratings: pkg.ratings?.averageRating
          ? {
              average: pkg.ratings.averageRating,
              count: pkg.ratings.totalReviews || 0,
            }
          : undefined,
        urgency: {
          bookingCountToday: pkg.popularity?.booking_count || 0,
          lastBookedAt: undefined,
        },
        availability: {
          status: pkg.availability?.status || 'high',
          label:
            pkg.availability?.status === 'available'
              ? 'Tersedia'
              : pkg.availability?.status === 'limited'
              ? 'Terbatas'
              : 'Segera habis',
        },
      }));

      setPackages(transformedPackages);
    } catch (error) {
      console.error('Failed to load packages:', error);
      setPackages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase()) ||
    pkg.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Pilih Paket Wisata</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari paket atau destinasi..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Package List */}
        <div className="overflow-y-auto p-4 space-y-3" style={{ height: 'calc(90vh - 160px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <PackageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Paket tidak ditemukan' : 'Tidak ada paket tersedia'}
              </p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  onSelect(pkg);
                  onOpenChange(false);
                }}
                className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                  selectedPackageId === pkg.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {pkg.thumbnailUrl ? (
                      <img
                        src={pkg.thumbnailUrl}
                        alt={pkg.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <PackageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Package Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 truncate">{pkg.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">
                        <MapPin className="h-3 w-3 mr-1" />
                        {pkg.destination}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {pkg.duration.label}
                      </Badge>
                    </div>

                    {/* Trust Signals */}
                    <div className="flex items-center gap-3 text-xs mb-2">
                      {pkg.ratings && pkg.ratings.count > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{pkg.ratings.average}</span>
                          <span className="text-muted-foreground">({pkg.ratings.count})</span>
                        </div>
                      )}
                      {pkg.urgency.bookingCountToday > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Users className="h-3 w-3" />
                          <span>{pkg.urgency.bookingCountToday} booking hari ini</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrency(pkg.pricingTiers[0]?.ntaPrice || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Harga NTA</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-semibold">
                            {formatCurrency(pkg.pricingTiers[0]?.margin || 0)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Komisi/pax</p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
