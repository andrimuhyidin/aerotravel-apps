/**
 * Packages/Explore Page - Premium Mobile Native Style
 * Route: /[locale]/packages
 */

import { MapPin, Sparkles, Star } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
// Filter removed - search is in header
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

  // Destination categories
  const categories = [
    { label: 'Semua', emoji: '🌊', active: true },
    { label: 'Lampung', emoji: '🏝️', active: false },
    { label: 'NTT', emoji: '🦎', active: false },
    { label: 'Papua', emoji: '🪸', active: false },
    { label: 'Jawa', emoji: '⛵', active: false },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Category Chips - Sticky */}
      <div className="no-scrollbar sticky top-14 z-40 flex gap-2 overflow-x-auto bg-slate-50 px-4 py-3 dark:bg-slate-950">
        {categories.map((cat) => (
          <button
            key={cat.label}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              cat.active
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-white text-muted-foreground shadow-sm dark:bg-slate-800'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-foreground">
            {packages.length} Paket Tersedia
          </p>
        </div>
        <button className="text-xs font-medium text-primary">Urutkan</button>
      </div>

      {/* Package Cards - Premium Style */}
      <div className="px-4 pb-24">
        {packages.map((pkg, idx) => (
          <Link key={pkg.id} href={`/${locale}/packages/detail/${pkg.slug}`} className="mb-6 block last:mb-0">
            <div className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all active:scale-[0.98] dark:bg-slate-800">
              {/* Image Header with Gradient Overlay */}
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 to-blue-500/20">
                <div className="flex h-full items-center justify-center text-6xl">
                  {pkg.image}
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* Top Badges */}
                <div className="absolute left-3 right-3 top-3 flex justify-between">
                  <div className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                    {pkg.duration}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {pkg.rating.toFixed(1)}
                  </div>
                </div>
                {/* Hot Badge for first item */}
                {idx === 0 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Sparkles className="h-3 w-3" />
                    BEST SELLER
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="p-4">
                <div className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {pkg.location}
                </div>
                <h3 className="mb-3 line-clamp-2 text-base font-bold leading-snug text-foreground">
                  {pkg.name}
                </h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Mulai dari</p>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(pkg.price)}
                    </p>
                  </div>
                  <Button size="sm" className="h-9 rounded-xl px-5 text-xs font-semibold">
                    Pesan
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
