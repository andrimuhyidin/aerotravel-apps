/**
 * Destination Detail Page
 * Displays comprehensive information about a destination
 *
 * Route: /[locale]/destinations/[slug]
 */

// Force dynamic rendering - uses cookies for Supabase
export const dynamic = 'force-dynamic';

import {
  ChevronLeft,
  Cloud,
  HelpCircle,
  Lightbulb,
  MapPin,
  Star,
} from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DestinationHero } from '@/components/destinations/destination-hero';
import { PackagesGrid } from '@/components/destinations/packages-grid';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { AISummary } from '@/components/seo/ai-summary';
import { InternalLinks } from '@/components/seo/internal-links';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { locales } from '@/i18n';
import { getDestinationBySlug } from '@/lib/destinations/data';
import { generateDestinationSpeakable } from '@/lib/seo/speakable-schema';
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
} from '@/lib/seo/structured-data';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, slug: 'placeholder' }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const destination = await getDestinationBySlug(slug);
  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  return {
    title: `${destination.name} - ${destination.province} | Aero Travel`,
    description: destination.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/destinations/${slug}`,
      languages: {
        id: `${baseUrl}/id/destinations/${slug}`,
        en: `${baseUrl}/en/destinations/${slug}`,
        'x-default': `${baseUrl}/id/destinations/${slug}`,
      },
    },
    openGraph: {
      title: `${destination.name} - ${destination.province}`,
      description: destination.description,
      url: `${baseUrl}/${locale}/destinations/${slug}`,
      siteName: 'MyAeroTravel',
      images: [{ url: destination.featuredImage, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    keywords: [
      destination.name,
      destination.province,
      'wisata bahari',
      'destinasi wisata',
      ...destination.highlights,
    ],
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const destination = await getDestinationBySlug(slug);
  if (!destination) {
    notFound();
  }

  // Structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Destinasi', url: '/destinations' },
    { name: destination.name, url: `/destinations/${slug}` },
  ]);

  const faqSchema =
    destination.faqs.length > 0 ? generateFAQSchema(destination.faqs) : null;

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.name,
    description: destination.description,
    address: {
      '@type': 'PostalAddress',
      addressRegion: destination.province,
      addressCountry: 'ID',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.coordinates.lat,
      longitude: destination.coordinates.lng,
    },
    touristType: ['Beach', 'Marine Tourism', 'Snorkeling', 'Island Hopping'],
  };

  const speakableSchema = generateDestinationSpeakable({
    name: destination.name,
    description: destination.description,
    province: destination.province,
    slug: slug,
    locale,
  });

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema,
          placeSchema,
          faqSchema,
          speakableSchema,
        ].filter((item): item is NonNullable<typeof item> => item !== null)}
      />

      <Section>
        <Container className="max-w-6xl">
          {/* Back Button */}
          <Link
            href={`/${locale}/destinations`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Destinasi
          </Link>

          {/* Hero */}
          <DestinationHero destination={destination} />

          {/* AI Summary */}
          <div className="mt-8">
            <AISummary
              summary={
                destination.longDescription.trim().split('\n\n')[0] ||
                destination.description
              }
              bulletPoints={destination.highlights || []}
            />
          </div>

          {/* About */}
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold">
              Tentang {destination.name}
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {destination.longDescription.split('\n\n').map((para, idx) => (
                <p key={idx} className="mb-4 text-muted-foreground">
                  {para.trim()}
                </p>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="mt-8 rounded-2xl bg-primary/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Star className="h-5 w-5 text-primary" />
              Highlight Destinasi
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {destination.highlights.map((highlight, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <span className="mt-1 text-primary">✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* Attractions */}
          {destination.attractions.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-bold">Atraksi Utama</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {destination.attractions.map((attraction, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-bold">{attraction.name}</h3>
                      <Badge variant="outline" className="shrink-0">
                        {attraction.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attraction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Info */}
          <div className="mt-8 rounded-2xl bg-blue-50 p-6 dark:bg-blue-950/20">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Informasi Cuaca
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Musim Kemarau
                </p>
                <p className="font-semibold">
                  {destination.weatherInfo.drySeasonStart} -{' '}
                  {destination.weatherInfo.drySeasonEnd}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Musim Hujan
                </p>
                <p className="font-semibold">
                  {destination.weatherInfo.wetSeasonStart} -{' '}
                  {destination.weatherInfo.wetSeasonEnd}
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          {destination.tips.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                Tips Perjalanan
              </h2>
              <ul className="space-y-2">
                {destination.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/20"
                  >
                    <span className="mt-0.5 text-yellow-600 dark:text-yellow-400">
                      💡
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Packages */}
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">
              Paket Trip ke {destination.name}
            </h2>
            <PackagesGrid destinationName={destination.name} locale={locale} />
          </div>

          {/* FAQs */}
          {destination.faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <HelpCircle className="h-6 w-6 text-primary" />
                FAQ
              </h2>
              <div className="space-y-4">
                {destination.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800"
                  >
                    <h3 className="mb-2 font-bold">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">
              Siap Jelajahi {destination.name}?
            </h2>
            <p className="mb-4 text-muted-foreground">
              Pesan paket trip sekarang dan dapatkan harga terbaik
            </p>
            <Link
              href={`/${locale}/packages?destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary/90"
            >
              <MapPin className="h-5 w-5" />
              Lihat Paket Trip
            </Link>
          </div>

          {/* Internal Links */}
          <div className="mt-12 border-t pt-8">
            <InternalLinks
              currentPage={`/destinations/${slug}`}
              type="related"
              locale={locale}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
