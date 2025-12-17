/**
 * Packages Page
 * Route: /[locale]/packages
 */

import { Filter, MapPin, Search, Star } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Paket Wisata - Aero Travel',
    description:
      'Pilih paket wisata bahari terbaik. Pahawang, Kiluan, Labuan Bajo, dan destinasi eksotis lainnya.',
    alternates: {
      canonical: `${baseUrl}/${locale}/packages`,
    },
  };
}

export default async function PackagesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch packages from database
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  type PackageRow = {
    id: string;
    slug: string;
    name: string;
    destination: string;
    province: string;
    duration_days: number;
    duration_nights: number;
    package_prices: { price_publish: number }[];
  };

  const { data } = await supabase
    .from('packages')
    .select(
      `
      id,
      slug,
      name,
      destination,
      province,
      duration_days,
      duration_nights,
      package_prices (
        price_publish
      )
    `
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const dbPackages = data as PackageRow[] | null;

  const packages = (dbPackages || []).map((pkg) => {
    const prices = pkg.package_prices;
    const lowestPrice = prices?.[0]?.price_publish || 0;
    return {
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      location: pkg.province || 'Indonesia',
      price: lowestPrice,
      rating: 4.8 + Math.random() * 0.2, // Placeholder
      reviews: Math.floor(50 + Math.random() * 150), // Placeholder
      image: getPackageEmoji(pkg.destination),
      duration: `${pkg.duration_days} Hari ${pkg.duration_nights} Malam`,
    };
  });

  function getPackageEmoji(destination: string): string {
    const map: Record<string, string> = {
      'Pulau Pahawang': '🏝️',
      'Teluk Kiluan': '🐬',
      'Labuan Bajo': '🦎',
      'Raja Ampat': '🪸',
      Karimunjawa: '⛵',
      'Tanjung Lesung': '🏖️',
    };
    return map[destination] || '🌊';
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex flex-col">
      {/* Header with Search */}
      <div className="sticky top-12 z-40 bg-background">
        <div className="px-5 py-4">
          <h1 className="mb-3 text-xl font-bold">Explore Paket</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari destinasi..."
                className="h-11 rounded-xl border-0 bg-muted/60 pl-11 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl border-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">
          {['Semua', 'Lampung', 'NTT', 'Papua', 'Jawa'].map((filter, i) => (
            <button
              key={filter}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                i === 0
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pb-2">
        <p className="text-xs text-muted-foreground">
          Menampilkan {packages.length} paket
        </p>
      </div>

      {/* Package Cards */}
      <div className="space-y-4 px-5 pb-8">
        {packages.map((pkg) => (
          <Link key={pkg.id} href={`/${locale}/packages/all/${pkg.slug}`}>
            <div className="overflow-hidden rounded-2xl bg-white shadow-md transition-all active:scale-[0.98]">
              {/* Image Header */}
              <div className="relative aspect-[2/1] bg-gradient-to-br from-primary/20 to-aero-teal/20">
                <div className="flex h-full items-center justify-center text-5xl">
                  {pkg.image}
                </div>
                {/* Rating Badge */}
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {pkg.rating.toFixed(1)}
                </div>
                {/* Duration Badge */}
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                  {pkg.duration}
                </div>
              </div>
              {/* Content */}
              <div className="p-4">
                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {pkg.location}
                </div>
                <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug">
                  {pkg.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Mulai dari</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(pkg.price)}
                    </p>
                  </div>
                  <Button size="sm" className="h-9 rounded-xl px-4 text-xs">
                    Lihat Detail
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
