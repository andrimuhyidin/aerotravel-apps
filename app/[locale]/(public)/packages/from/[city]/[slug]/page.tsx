/**
 * Programmatic SEO Page
 * Route: /[locale]/packages/from/[city]/[slug]
 *
 * AI-generated landing pages for each package + origin city combination
 * Uses ISR (Incremental Static Regeneration) for optimal performance
 */

import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string; city: string; slug: string }>;
};

// ISR: Revalidate every 24 hours
export const revalidate = 86400;

export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  // This allows for thousands of pages without building them all upfront
  return locales.map((locale) => ({ locale }));
}

/**
 * Generate metadata from SEO page content
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('seo_pages')
    .select('title, meta_description, keywords, package_name, package_destination')
    .eq('slug', slug)
    .eq('origin_city', city)
    .eq('is_published', true)
    .single();

  const seoPage = data as {
    title: string;
    meta_description: string | null;
    keywords: string[] | null;
    package_name: string | null;
    package_destination: string | null;
  } | null;

  if (!seoPage) {
    return { title: 'Paket Wisata - Aero Travel' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: seoPage.title,
    description: seoPage.meta_description || `Paket wisata dari ${city}`,
    keywords: seoPage.keywords || [],
    alternates: {
      canonical: `${baseUrl}/${locale}/packages/from/${city}/${slug}`,
    },
    openGraph: {
      title: seoPage.title,
      description: seoPage.meta_description || `Paket wisata dari ${city}`,
      type: 'website',
      url: `${baseUrl}/${locale}/packages/from/${city}/${slug}`,
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      siteName: 'Aero Travel',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoPage.title,
      description: seoPage.meta_description || `Paket wisata dari ${city}`,
    },
  };
}

/**
 * Capitalize city name for display
 */
function formatCityName(city: string): string {
  return city
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function SEOPackagePage({ params }: Props) {
  const { locale, city, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  // Fetch SEO page content
  const { data: seoPageData } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', slug)
    .eq('origin_city', city)
    .eq('is_published', true)
    .single();

  type SeoPageRow = {
    id: string;
    package_id: string;
    origin_city: string;
    slug: string;
    title: string;
    description: string | null;
    meta_description: string | null;
    h1: string | null;
    h2: string[] | null;
    content: string | null;
    keywords: string[] | null;
    package_name: string | null;
    package_destination: string | null;
  };

  const seoPage = seoPageData as SeoPageRow | null;

  if (!seoPage) {
    notFound();
  }

  // Fetch actual package data for pricing and details
  const { data: packageData } = await supabase
    .from('packages')
    .select(
      `
      id,
      name,
      slug,
      description,
      destination,
      province,
      duration_days,
      duration_nights,
      min_pax,
      max_pax,
      package_type,
      average_rating,
      review_count,
      inclusions,
      exclusions,
      package_prices (
        min_pax,
        max_pax,
        price_publish
      )
    `
    )
    .eq('id', seoPage.package_id)
    .eq('is_published', true)
    .single();

  type PackageDetail = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    destination: string;
    province: string;
    duration_days: number;
    duration_nights: number;
    min_pax: number;
    max_pax: number;
    package_type: string;
    average_rating: number | null;
    review_count: number | null;
    inclusions: string[] | null;
    exclusions: string[] | null;
    package_prices: {
      min_pax: number;
      max_pax: number;
      price_publish: number;
    }[];
  };

  const pkg = packageData as PackageDetail | null;

  if (!pkg) {
    notFound();
  }

  const prices = pkg.package_prices || [];
  const lowestPrice =
    prices.length > 0 ? Math.min(...prices.map((p) => p.price_publish)) : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const cityDisplay = formatCityName(city);
  const h2Sections = seoPage.h2 || [];

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: seoPage.title,
    description: seoPage.meta_description || seoPage.description,
    touristType: 'Traveler',
    offers: {
      '@type': 'Offer',
      price: lowestPrice,
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
    },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: pkg.duration_days,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: `Perjalanan dari ${cityDisplay}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Wisata di ${pkg.destination}`,
        },
      ],
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'Aero Travel',
      url: 'https://aerotravel.co.id',
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col pb-24">
        {/* Hero Section */}
        <div className="relative">
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/30 via-aero-teal/20 to-blue-100">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-sm font-medium text-primary/80">
                  Dari {cityDisplay}
                </p>
                <div className="text-7xl">🏝️</div>
              </div>
            </div>
          </div>

          {/* Back & Actions */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <Link
              href={`/${locale}/packages`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </Link>
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur">
                <Share2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Badge */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              {pkg.package_type === 'open_trip' ? 'Open Trip' : 'Private'}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {(pkg.average_rating || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-5">
          {/* SEO H1 */}
          <h1 className="mb-2 text-xl font-bold leading-tight">
            {seoPage.h1 || seoPage.title}
          </h1>

          <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {pkg.destination}, {pkg.province}
          </div>

          {/* Origin City Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
            <span className="text-xs font-medium text-primary">
              Berangkat dari {cityDisplay}
            </span>
          </div>

          {/* Quick Info */}
          <div className="mb-5 flex gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                {pkg.duration_days}H{pkg.duration_nights}M
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">
                {pkg.min_pax}-{pkg.max_pax} pax
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Setiap Hari</span>
            </div>
          </div>

          {/* SEO Content Sections */}
          {seoPage.content && (
            <div className="mb-6">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {seoPage.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* H2 Sections as Cards */}
          {h2Sections.length > 0 && (
            <div className="mb-6 space-y-3">
              {h2Sections.map((heading, idx) => (
                <Card key={idx} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <h2 className="mb-2 text-sm font-semibold">{heading}</h2>
                    <p className="text-xs text-muted-foreground">
                      {idx === 0 &&
                        `Perjalanan wisata ${pkg.name} dari ${cityDisplay} memberikan pengalaman terbaik.`}
                      {idx === 1 &&
                        `Nikmati berbagai destinasi menarik di ${pkg.destination} bersama guide profesional.`}
                      {idx === 2 &&
                        `Fasilitas lengkap termasuk transportasi, penginapan, dan makan sesuai paket.`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Price Tiers */}
          {prices.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-semibold">
                Harga dari {cityDisplay}
              </h2>
              <div className="space-y-2">
                {prices.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tier.min_pax}-{tier.max_pax} orang
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {formatPrice(tier.price_publish)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusions */}
          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-semibold">Sudah Termasuk</h2>
              <div className="space-y-2">
                {pkg.inclusions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/10 to-aero-teal/10 p-4">
            <h2 className="mb-2 text-sm font-semibold">
              Siap Berangkat dari {cityDisplay}?
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Tim kami siap membantu merencanakan perjalanan Anda
            </p>
            <div className="flex gap-2">
              <Link href={`/${locale}/book?package=${pkg.slug}`} className="flex-1">
                <Button className="w-full">
                  Booking Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/6281234567890"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 text-sm font-medium text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Keywords for SEO (hidden visually) */}
          {seoPage.keywords && seoPage.keywords.length > 0 && (
            <div className="sr-only">
              <p>
                Kata kunci terkait: {seoPage.keywords.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Fixed CTA */}
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <div className="mx-auto w-full max-w-md border-t bg-background px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">
                  Dari {cityDisplay}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(lowestPrice)}
                  <span className="text-xs font-normal text-muted-foreground">
                    /pax
                  </span>
                </p>
              </div>
              <Link href={`/${locale}/book?package=${pkg.slug}`} className="flex-1">
                <Button className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/25">
                  Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

