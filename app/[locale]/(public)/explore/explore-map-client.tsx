/**
 * Explore Map Client Component
 * Interactive map to discover destinations
 * Uses CSS-based map visualization (no external map library required)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Filter,
  Loader2,
  MapPin,
  Package,
  Search,
  Star,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type Package = {
  id: string;
  name: string;
  slug: string;
  type: string;
  duration: string;
  lowestPrice: number;
  rating: number;
  reviewCount: number;
};

type Destination = {
  destination: string;
  province: string;
  coords: { lat: number; lng: number };
  packageCount: number;
  packages: Package[];
  lowestPrice: number;
  highestRating: number;
};

type ExploreMapClientProps = {
  locale: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ExploreMapClient({ locale }: ExploreMapClientProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProvince) params.set('province', selectedProvince);
      
      const response = await fetch(`/api/public/destinations?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setDestinations(data.destinations || []);
      setProvinces(data.provinces || []);
    } catch (error) {
      logger.error('Failed to fetch destinations', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProvince]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const filteredDestinations = destinations.filter((d) =>
    d.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDestination(dest);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-100 pb-20">
      {/* Header with Search */}
      <div className="sticky top-0 z-20 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari destinasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh]">
              <SheetHeader>
                <SheetTitle>Filter Destinasi</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Provinsi</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedProvince === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedProvince('');
                        setFilterOpen(false);
                      }}
                    >
                      Semua
                    </Button>
                    {provinces.map((prov) => (
                      <Button
                        key={prov}
                        variant={selectedProvince === prov ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedProvince(prov);
                          setFilterOpen(false);
                        }}
                      >
                        {prov}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {selectedProvince && (
          <div className="mt-2 flex items-center gap-1">
            <Badge variant="secondary" className="gap-1">
              {selectedProvince}
              <button onClick={() => setSelectedProvince('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Map Visualization Area */}
      <div className="relative flex-1 bg-gradient-to-b from-blue-100 to-green-100 p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Simple Map Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.destination}
                  onClick={() => handleSelectDestination(dest)}
                  className={cn(
                    'relative rounded-xl bg-white p-4 text-left shadow-md transition-all',
                    'hover:scale-105 hover:shadow-lg',
                    selectedDestination?.destination === dest.destination &&
                      'ring-2 ring-primary'
                  )}
                >
                  {/* Icon */}
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-sm truncate">{dest.destination}</h3>
                  <p className="text-xs text-muted-foreground">{dest.province}</p>

                  {/* Stats */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-3 w-3" />
                      {dest.packageCount}
                    </span>
                    {dest.highestRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {dest.highestRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Mulai {formatCurrency(dest.lowestPrice)}
                  </p>
                </button>
              ))}
            </div>

            {filteredDestinations.length === 0 && (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <p>Tidak ada destinasi ditemukan</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Destination Detail */}
      {selectedDestination && (
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md">
          <Card className="mx-4 shadow-xl">
            <CardContent className="p-4">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="font-bold">{selectedDestination.destination}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedDestination.province} • {selectedDestination.packageCount} paket
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedDestination(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Package List */}
              <div className="h-40 overflow-y-auto">
                <div className="space-y-2">
                  {selectedDestination.packages.map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/${locale}/packages/detail/${pkg.slug}`}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                        🏝️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pkg.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{pkg.duration}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {pkg.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-primary">
                          {formatCurrency(pkg.lowestPrice)}
                        </p>
                        {pkg.rating > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px]">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {pkg.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

