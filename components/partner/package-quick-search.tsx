/**
 * Package Quick Search - Search bar dengan instant results
 * Debounced search untuk cari paket dengan cepat dari dashboard
 */

'use client';

import { Search, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type PackageSearchResult = {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  baseNTAPrice: number;
  basePublishPrice: number;
};

type PackageQuickSearchProps = {
  locale: string;
};

export function PackageQuickSearch({ locale }: PackageQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PackageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void searchPackages(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchPackages = async (searchQuery: string) => {
    try {
      const res = await fetch(
        `/api/partner/packages/search?q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      if (!res.ok) throw new Error('Search failed');

      const data = (await res.json()) as { packages: PackageSearchResult[] };
      setResults(data.packages || []);
      setShowResults(true);
    } catch (error) {
      logger.error('Failed to search packages', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Cari paket wisata..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="h-12 pl-10 pr-10"
          aria-label="Cari paket wisata"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowResults(false)}
            aria-hidden="true"
          />

          {/* Results Card */}
          <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto shadow-xl">
            <CardContent className="p-2">
              <div className="space-y-1">
                {results.map((pkg) => {
                  const commission = pkg.basePublishPrice - pkg.baseNTAPrice;
                  const commissionRate =
                    pkg.basePublishPrice > 0
                      ? Math.round((commission / pkg.basePublishPrice) * 100)
                      : 0;

                  return (
                    <Link
                      key={pkg.id}
                      href={`/${locale}/partner/packages/${pkg.id}`}
                      onClick={() => {
                        setShowResults(false);
                        handleClear();
                      }}
                      className={cn(
                        'block rounded-lg p-3 transition-colors hover:bg-accent',
                        'focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {pkg.name}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              <span>{pkg.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              <span>{pkg.durationDays} hari</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrency(pkg.baseNTAPrice)}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-green-50 text-green-700"
                          >
                            Komisi {commissionRate}%
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowResults(false)}
            aria-hidden="true"
          />
          <Card className="absolute left-0 right-0 top-full z-50 mt-2 shadow-xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada paket ditemukan untuk &quot;{query}&quot;
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

