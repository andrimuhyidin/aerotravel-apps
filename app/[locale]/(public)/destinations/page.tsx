/**
 * Destinations Index Page
 * Lists all available destinations
 * 
 * Route: /[locale]/destinations
 */

// Force dynamic rendering - uses cookies for Supabase
export const dynamic = 'force-dynamic';

import { MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { DestinationCard } from '@/components/destinations/destination-card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { JsonLd } from '@/components/seo/json-ld';
import { locales } from '@/i18n';
import { getAllDestinations } from '@/lib/destinations/data';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Destinasi Wisata Bahari | Aero Travel',
    description:
      'Jelajahi destinasi wisata bahari terbaik di Indonesia. Pahawang, Kiluan, Labuan Bajo, Raja Ampat, dan banyak lagi.',
    alternates: {
      canonical: `${baseUrl}/${locale}/destinations`,
      languages: {
        id: `${baseUrl}/id/destinations`,
        en: `${baseUrl}/en/destinations`,
        'x-default': `${baseUrl}/id/destinations`,
      },
    },
    openGraph: {
      title: 'Destinasi Wisata Bahari Terbaik di Indonesia',
      description: 'Jelajahi destinasi wisata bahari terbaik di Indonesia',
      url: `${baseUrl}/${locale}/destinations`,
      siteName: 'MyAeroTravel',
      images: [{ url: `${baseUrl}/og-destinations.jpg`, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    keywords: [
      'destinasi wisata',
      'wisata bahari',
      'pantai indonesia',
      'pulau indonesia',
      'snorkeling',
      'diving',
    ],
  };
}

export default async function DestinationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const destinations = await getAllDestinations();

  // ItemList schema
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Destinations',
    numberOfItems: destinations.length,
    itemListElement: destinations.map((dest, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/destinations/${dest.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />

      <Section className="bg-slate-50 dark:bg-slate-950">
        <Container>
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold">🏝️ Destinasi Wisata</h1>
            <p className="text-muted-foreground">
              Jelajahi destinasi wisata bahari terbaik di Indonesia
            </p>
          </div>

          {/* Destinations Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                locale={locale}
              />
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">
              Tidak Menemukan Destinasi Impian Anda?
            </h2>
            <p className="mb-4 text-muted-foreground">
              Hubungi kami untuk custom trip sesuai keinginan Anda
            </p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary/90"
            >
              <MapPin className="h-5 w-5" />
              Hubungi Kami
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}

