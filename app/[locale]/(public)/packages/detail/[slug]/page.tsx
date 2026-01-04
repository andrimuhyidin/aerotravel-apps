/**
 * Package Detail Page - Mobile Native Style
 * Route: /packages/detail/[slug]
 */

import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ViewPackageTracker } from '@/components/analytics/page-journey-tracker';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { PackageReviewList } from '@/components/public/package-review-list';
import { AISummary } from '@/components/seo/ai-summary';
import { AuthorByline } from '@/components/seo/author-bio';
import { JsonLd } from '@/components/seo/json-ld';
import { RelatedContent } from '@/components/seo/related-content';
import { TrustBar } from '@/components/seo/trust-signals';
import { Button } from '@/components/ui/button';
import { locales } from '@/i18n';
import { getDefaultAuthor } from '@/lib/seo/authors';
import { generateEventSchema, isSpecialEvent } from '@/lib/seo/event-schema';
import { generatePackageSpeakable } from '@/lib/seo/speakable-schema';
import { generatePackageSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const { data } = await supabase
    .from('packages')
    .select('name, description, destination, image_url')
    .eq('slug', slug)
    .single();

  const pkg = data as {
    name: string;
    description: string | null;
    destination: string;
    image_url?: string | null;
  } | null;

  if (!pkg) {
    return { title: 'Package Not Found' };
  }

  const title = `${pkg.name} - Aero Travel`;
  const description = pkg.description || `Paket wisata ${pkg.destination}`;
  const pageUrl = `${baseUrl}/packages/detail/${slug}`;
  const imageUrl = pkg.image_url || `${baseUrl}/og-default.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'MyAeroTravel',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: pkg.name,
        },
      ],
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        id: `${baseUrl}/id/packages/detail/${slug}`,
        en: `${baseUrl}/en/packages/detail/${slug}`,
        'x-default': `${baseUrl}/id/packages/detail/${slug}`,
      },
    },
  };
}

export default async function PackageDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

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

  // Get package with prices
  const { data } = await supabase
    .from('packages')
    .select(
      `
      *,
      package_prices (
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `
    )
    .eq('slug', slug)
    .single();

  const pkg = data as PackageDetail | null;

  if (!pkg) {
    notFound();
  }

  const prices = pkg.package_prices || [];
  const lowestPrice =
    prices.length > 0 ? Math.min(...prices.map((p) => p.price_publish)) : 0;
  const inclusions = pkg.inclusions || [];
  const exclusions = pkg.exclusions || [];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  // Generate structured data
  const packageSchema = generatePackageSchema({
    name: pkg.name,
    description: pkg.description || `Paket wisata ${pkg.destination}`,
    slug: pkg.slug,
    price: lowestPrice,
    destination: pkg.destination,
    duration: `${pkg.duration_days} hari ${pkg.duration_nights} malam`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Paket Wisata', url: '/packages' },
    { name: pkg.name, url: `/packages/detail/${pkg.slug}` },
  ]);

  // Check if this is a special event (holiday, KOL trip, etc.)
  // TODO: Get actual tags from database when implemented
  const isEvent = isSpecialEvent({
    tags: [], // Replace with pkg.tags when available
    isKOLTrip: false, // Replace with pkg.is_kol_trip when available
    specialOffer: false, // Replace with pkg.special_offer when available
  });

  // Generate Event schema if applicable
  const eventSchema = isEvent
    ? generateEventSchema({
        name: pkg.name,
        description: pkg.description || `Paket wisata ${pkg.destination}`,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder: 1 week from now
        endDate: new Date(
          Date.now() + (7 + pkg.duration_days) * 24 * 60 * 60 * 1000
        ).toISOString(),
        location: `${pkg.destination}, ${pkg.province}`,
        organizer: 'Aero Travel',
        price: lowestPrice,
        availability: 'InStock',
        image: `${process.env.NEXT_PUBLIC_APP_URL}/images/packages/${pkg.slug}.jpg`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/packages/detail/${pkg.slug}`,
      })
    : null;

  // Generate Speakable schema for voice search
  const speakableSchema = generatePackageSpeakable({
    name: pkg.name,
    description: pkg.description || `Paket wisata ${pkg.destination}`,
    destination: pkg.destination,
    duration: `${pkg.duration_days} hari ${pkg.duration_nights} malam`,
    price: lowestPrice,
    slug: pkg.slug,
    locale,
  });

  // Generate AI Summary from description
  const aiSummary =
    pkg.description ||
    `${pkg.name} adalah paket wisata ${pkg.package_type === 'open_trip' ? 'open trip' : 'private'} ke ${pkg.destination}, ${pkg.province}. Trip ini berlangsung selama ${pkg.duration_days} hari ${pkg.duration_nights} malam, cocok untuk ${pkg.min_pax}-${pkg.max_pax} orang.`;

  const aiKeyPoints = [
    `Durasi: ${pkg.duration_days} hari ${pkg.duration_nights} malam`,
    `Lokasi: ${pkg.destination}, ${pkg.province}`,
    `Kapasitas: ${pkg.min_pax}-${pkg.max_pax} peserta`,
    lowestPrice > 0 ? `Harga mulai ${formatPrice(lowestPrice)}/orang` : null,
    pkg.package_type === 'open_trip'
      ? 'Open Trip - bergabung dengan peserta lain'
      : 'Private Trip - eksklusif untuk grup Anda',
  ].filter(Boolean) as string[];

  // Get default author (trip curator)
  const author = getDefaultAuthor();

  // Related packages query
  const { data: relatedPackages } = await supabase
    .from('packages')
    .select('name, slug')
    .eq('destination', pkg.destination)
    .neq('slug', slug)
    .limit(4);

  const relatedLinks = (relatedPackages || []).map((p) => ({
    title: p.name,
    href: `/${locale}/packages/detail/${p.slug}`,
  }));

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={[packageSchema, breadcrumbSchema, eventSchema, speakableSchema].filter((s): s is Record<string, unknown> => s !== null && s !== undefined)} />
      
      {/* Journey Tracking */}
      <ViewPackageTracker
        packageId={pkg.id}
        packageName={pkg.name}
        price={lowestPrice}
        category={pkg.package_type}
      />
      
      {/* Hero Section */}
      <Section className="relative p-0" spacing="none">
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-primary/30 to-aero-teal/30">
            <div className="flex h-full items-center justify-center text-7xl">
              🏝️
            </div>
          </div>

          {/* Back & Actions */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
            <Link
              href={`/${locale}/packages`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur"
              aria-label="Kembali ke daftar paket"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </Link>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/30 backdrop-blur text-white hover:bg-black/50"
                aria-label="Bagikan paket"
              >
                <Share2 className="h-5 w-5" />
              </Button>
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
      </Section>

      {/* Main Content */}
      <Section className="bg-background" spacing="md">
        <Container>
          {/* Header Section */}
          <header className="mb-6">
            <h1 className="mb-2 text-xl font-bold leading-tight">{pkg.name}</h1>
            <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {pkg.destination}, {pkg.province}
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4">
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
          </header>

          {/* AI Summary Section */}
          <section id="summary" className="mb-6">
            <AISummary summary={aiSummary} bulletPoints={aiKeyPoints} />
          </section>

          {/* Author Section */}
          <section id="author" className="mb-6">
            <AuthorByline
              name={author.name}
              role={author.role}
              image={author.image}
              date="Trip Curator"
            />
          </section>

          {/* Description Section */}
          <section id="description" className="mb-6">
            <h2 className="mb-2 text-sm font-semibold">Deskripsi</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {pkg.description ||
                'Paket wisata premium dengan pengalaman terbaik.'}
            </p>
          </section>

          {/* Price Section */}
          {prices.length > 0 && (
            <section id="pricing" className="mb-6">
              <h2 className="mb-3 text-sm font-semibold">Harga</h2>
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
            </section>
          )}

          {/* Inclusions Section */}
          {inclusions.length > 0 && (
            <section id="inclusions" className="mb-6">
              <h2 className="mb-3 text-sm font-semibold">Sudah Termasuk</h2>
              <ul className="space-y-2">
                {inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Exclusions Section */}
          {exclusions.length > 0 && (
            <section id="exclusions" className="mb-6">
              <h2 className="mb-3 text-sm font-semibold">Tidak Termasuk</h2>
              <ul className="space-y-2">
                {exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <X className="h-3 w-3 text-red-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reviews Section */}
          <section id="reviews" className="mb-6">
            <PackageReviewList slug={slug} initialLimit={3} />
          </section>

          {/* Trust Signals Section */}
          <section id="trust" className="mb-6">
            <TrustBar />
          </section>

          {/* Related Packages Section */}
          {relatedLinks.length > 0 && (
            <section id="related" className="mb-6">
              <RelatedContent
                title="Paket Serupa"
                links={relatedLinks}
              />
            </section>
          )}

          {/* Contact Section */}
          <section id="contact" className="mb-6">
            <div className="rounded-2xl bg-muted/50 p-4">
              <h2 className="mb-2 text-sm font-semibold">Ada Pertanyaan?</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Hubungi tim kami untuk info lebih lanjut
              </p>
              <a
                href="https://wa.me/6281234567890"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
                aria-label="Hubungi via WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
                Chat WhatsApp
              </a>
            </div>
          </section>
        </Container>
      </Section>

      {/* Bottom Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <Container className="mx-auto w-full max-w-md border-t bg-background px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Mulai dari</p>
              <p className="text-lg font-bold text-primary">
                {formatPrice(lowestPrice)}
                <span className="text-xs font-normal text-muted-foreground">
                  /pax
                </span>
              </p>
            </div>
            <Link href={`/${locale}/book?package=${slug}`} className="flex-1">
              <Button className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/25">
                Booking
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
