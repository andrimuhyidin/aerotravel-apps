/**
 * Explore Page - Interactive Destination Map
 * Discover travel destinations with interactive map view
 *
 * Route: /explore
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { ExploreMapClient } from './explore-map-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d9488',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const title = 'Explore Destinasi - Aero Travel';
  const description = 'Jelajahi destinasi wisata terbaik di Indonesia. Temukan paket wisata sesuai budget dan preferensi Anda.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/explore`,
      languages: {
        id: `${baseUrl}/id/explore`,
        en: `${baseUrl}/en/explore`,
        'x-default': `${baseUrl}/id/explore`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/explore`,
      siteName: 'MyAeroTravel ID',
      images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630 }],
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

export default async function ExplorePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExploreMapClient locale={locale} />;
}

