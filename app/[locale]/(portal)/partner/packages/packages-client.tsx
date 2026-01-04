/**
 * Partner Packages Client Component - ENHANCED
 * Advanced filtering, view modes, and improved UX
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PackageCardEnhanced, type PackageSummary } from '@/components/partner/package-card-enhanced';
import { PackageFilterSidebar, type FilterState } from '@/components/partner/package-filter-sidebar';
import { PackageQuickViewModal } from '@/components/partner/package-quick-view-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Package as PackageIcon,
  SlidersHorizontal,
  X,
  Grid3x3,
  List,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type PackagesResponse = {
  packages: PackageSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ViewMode = 'grid' | 'list';

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 10000000],
  durations: [],
  dateFrom: undefined,
  dateTo: undefined,
  packageTypes: [],
  facilities: [],
  minRating: 0,
};

export function PackagesClient({ locale }: { locale: string }) {
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [quickViewPackageId, setQuickViewPackageId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const sortOptions = [
    { value: 'popularity', label: 'Terpopuler' },
    { value: 'price_asc', label: 'Harga Terendah' },
    { value: 'price_desc', label: 'Harga Tertinggi' },
    { value: 'commission', label: 'Komisi Tertinggi' },
    { value: 'rating', label: 'Rating Tertinggi' },
    { value: 'newest', label: 'Terbaru' },
  ];

  // Memoize fetchPackages to prevent recreating on every render
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: viewMode === 'list' ? '20' : '12',
        ...(searchQuery && { search: searchQuery }),
        ...(sortBy && { sortBy }),
      });

      // Add filter params
      if (filters.priceRange[0] > 0) {
        params.append('minPrice', filters.priceRange[0].toString());
      }
      if (filters.priceRange[1] < 10000000) {
        params.append('maxPrice', filters.priceRange[1].toString());
      }
      if (filters.durations.length > 0) {
        params.append('durations', filters.durations.join(','));
      }
      if (filters.dateFrom) {
        const dateFromStr = filters.dateFrom.toISOString().split('T')[0];
        if (dateFromStr) params.append('dateFrom', dateFromStr);
      }
      if (filters.dateTo) {
        const dateToStr = filters.dateTo.toISOString().split('T')[0];
        if (dateToStr) params.append('dateTo', dateToStr);
      }
      if (filters.packageTypes.length > 0) {
        params.append('packageTypes', filters.packageTypes.join(','));
      }
      if (filters.facilities.length > 0) {
        params.append('facilities', filters.facilities.join(','));
      }
      if (filters.minRating > 0) {
        params.append('minRating', filters.minRating.toString());
      }

      const res = await fetch(`/api/partner/packages?${params}`);
      if (!res.ok) throw new Error('Failed to fetch packages');

      const data: PackagesResponse = await res.json();
      setPackages(data.packages);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Failed to fetch packages', error);
      toast.error('Gagal memuat paket wisata');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, page, viewMode]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Memoize handleClearFilters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
    setPage(1);
  }, []);

  // Memoize active filter count calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.durations.length > 0) count += filters.durations.length;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.packageTypes.length > 0) count += filters.packageTypes.length;
    if (filters.facilities.length > 0) count += filters.facilities.length;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = useMemo(
    () => activeFilterCount > 0 || searchQuery,
    [activeFilterCount, searchQuery]
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Katalog Paket Wisata
          </h1>
          <p className="text-muted-foreground">
            Temukan dan tawarkan paket liburan terbaik untuk pelanggan Anda
          </p>
        </div>
      </div>

      {/* Search Bar - Prominent */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari paket wisata (cth: Bali, Honeymoon, Diving)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-4 text-base bg-background"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <PackageFilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background rounded-lg border p-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {activeFilterCount > 0 && (
                        <Badge variant="default" className="ml-1 rounded-full px-1.5 min-w-[20px]">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filter Paket</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <PackageFilterSidebar
                        filters={filters}
                        onFiltersChange={(newFilters) => {
                          setFilters(newFilters);
                          setMobileFiltersOpen(false);
                        }}
                        onClearFilters={() => {
                          handleClearFilters();
                          setMobileFiltersOpen(false);
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{pagination.total}</strong> paket ditemukan
                </div>

                {/* Active Filters Tags */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs gap-1"
                  >
                    <X className="h-3 w-3" />
                    Reset Filter
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="hidden md:flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filter Tags Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.durations.map((duration) => (
                  <Badge key={duration} variant="secondary" className="gap-1">
                    {duration === 4 ? '4-5 Hari' : duration === 6 ? '6+ Hari' : `${duration} Hari`}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          durations: filters.durations.filter((d) => d !== duration),
                        })
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.packageTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {type.replace('_', ' ')}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          packageTypes: filters.packageTypes.filter((t) => t !== type),
                        })
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Package Grid/List */}
            {loading ? (
              <PackageGridSkeleton viewMode={viewMode} />
            ) : packages.length === 0 ? (
              <EmptyState
                icon={PackageIcon}
                title="Tidak ada paket ditemukan"
                description="Coba ubah filter atau kata kunci pencarian Anda"
                action={
                  <Button variant="outline" onClick={handleClearFilters}>
                    Reset Filter
                  </Button>
                }
              />
            ) : (
              <>
                <div
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  {packages.map((pkg) => (
                    <PackageCardEnhanced
                      key={pkg.id}
                      package={pkg}
                      locale={locale}
                      onQuickView={setQuickViewPackageId}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium mx-2">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <PackageQuickViewModal
        packageId={quickViewPackageId}
        locale={locale}
        onClose={() => setQuickViewPackageId(null)}
      />
    </div>
  );
}

// Loading Skeleton
function PackageGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div
      className={cn(
        'grid gap-6',
        viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
      )}
    >
      {Array.from({ length: viewMode === 'grid' ? 9 : 6 }).map((_, i) => (
        <div key={i} className="border rounded-xl overflow-hidden bg-background">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="p-4 pt-0 border-t mt-3">
            <div className="flex justify-between items-end mb-3">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
