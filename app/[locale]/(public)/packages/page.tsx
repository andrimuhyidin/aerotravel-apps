/**
 * Packages/Explore Page - Premium Mobile Native Style
 * Route: /[locale]/packages
 */

import { MapPin, Sparkles, Star } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { BrowsePackagesTracker } from '@/components/analytics/page-journey-tracker';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
// Filter removed - search is in header
import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
};

// ISR - Revalidate every 5 minutes for better performance
export const revalidate = 300;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const title = 'Paket Wisata - Aero Travel';
  const description =
    'Pilih paket wisata bahari terbaik. Pahawang, Kiluan, Labuan Bajo, dan destinasi eksotis lainnya.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/packages`,
      languages: {
        id: `${baseUrl}/id/packages`,
        en: `${baseUrl}/en/packages`,
        'x-default': `${baseUrl}/id/packages`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/packages`,
      siteName: 'MyAeroTravel ID',
      images: [
        {
          url: `${baseUrl}/og-image-packages.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image-packages.jpg`],
    },
  };
}

export default async function PackagesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q: searchQuery, category } = await searchParams;
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
    average_rating: number | null;
    review_count: number | null;
    package_prices: { price_publish: number }[];
  };

  // Build query with filters
  let query = supabase
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
      average_rating,
      review_count,
      package_prices (
        price_publish
      )
    `
    )
    .eq('status', 'published');

  // Apply search filter
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,destination.ilike.%${searchQuery}%,province.ilike.%${searchQuery}%`);
  }

  // Apply category filter
  if (category && category !== 'semua') {
    const categoryMap: Record<string, string> = {
      lampung: 'Lampung',
      ntt: 'Nusa Tenggara Timur',
      papua: 'Papua',
      jawa: 'Jawa',
    };
    const provinceName = categoryMap[category.toLowerCase()];
    if (provinceName) {
      query = query.ilike('province', `%${provinceName}%`);
    }
  }

  const { data } = await query.order('created_at', { ascending: false });

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
      rating: pkg.average_rating || 0,
      reviews: pkg.review_count || 0,
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
    { label: 'Semua', emoji: '🌊', value: 'semua' },
    { label: 'Lampung', emoji: '🏝️', value: 'lampung' },
    { label: 'NTT', emoji: '🦎', value: 'ntt' },
    { label: 'Papua', emoji: '🪸', value: 'papua' },
    { label: 'Jawa', emoji: '⛵', value: 'jawa' },
  ];
  
  const activeCategory = category?.toLowerCase() || 'semua';

  // Generate ItemList schema for SEO
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Paket Wisata Aero Travel',
    description:
      'Daftar paket wisata bahari terbaik di Indonesia',
    numberOfItems: packages.length,
    itemListElement: packages.slice(0, 10).map((pkg, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: pkg.name,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id'}/${locale}/packages/detail/${pkg.slug}`,
        offers: {
          '@type': 'Offer',
          price: pkg.price,
          priceCurrency: 'IDR',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating:
          pkg.reviews > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: pkg.rating,
                reviewCount: pkg.reviews,
              }
            : undefined,
      },
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      <BrowsePackagesTracker />
      <Section className="bg-slate-50 dark:bg-slate-950">
      <Container className="p-0">
        <div className="flex min-h-screen flex-col">
          {/* Search Bar */}
          {searchQuery && (
            <div className="bg-slate-50 px-4 py-2 dark:bg-slate-950">
              <p className="text-xs text-muted-foreground">
                Hasil pencarian: &quot;{searchQuery}&quot;
                <Link href={`/${locale}/packages`} className="ml-2 text-primary hover:underline">
                  Hapus
                </Link>
              </p>
            </div>
          )}

          {/* Category Chips - Sticky */}
          <div className="no-scrollbar sticky top-14 z-40 flex gap-2 overflow-x-auto bg-slate-50 px-4 py-3 dark:bg-slate-950">
            {categories.map((cat) => {
              const isActive = cat.value === activeCategory;
              const href = cat.value === 'semua' 
                ? `/${locale}/packages${searchQuery ? `?q=${searchQuery}` : ''}`
                : `/${locale}/packages?category=${cat.value}${searchQuery ? `&q=${searchQuery}` : ''}`;
              
              return (
                <Link
                  key={cat.label}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-white text-muted-foreground shadow-sm hover:bg-muted dark:bg-slate-800'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </Link>
              );
            })}
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
        {packages.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Tidak ada paket yang ditemukan</p>
            <Link href={`/${locale}/packages`} className="mt-2 inline-block text-sm text-primary hover:underline">
              Lihat semua paket
            </Link>
          </div>
        )}
        {packages.map((pkg, idx) => (
          <Link 
            key={pkg.id} 
            href={`/${locale}/packages/detail/${pkg.slug}`} 
            className="mb-6 block last:mb-0"
            data-testid="package-card"
          >
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
      </Container>
    </Section>
    </>
  );
}
