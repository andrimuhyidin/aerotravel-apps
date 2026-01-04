/**
 * KOL Trips Listing Page
 * Route: /[locale]/kol
 * Lists all active KOL/Influencer trips
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { KolTripsListClient } from './kol-trips-list-client';

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
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  const title = 'Trip Bareng KOL & Influencer - Aero Travel';
  const description =
    'Ikut trip eksklusif bareng KOL dan Influencer favorit kamu. Pengalaman liburan premium dengan komunitas yang seru!';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/kol`,
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
    alternates: {
      canonical: `${baseUrl}/${locale}/kol`,
      languages: {
        id: `${baseUrl}/id/kol`,
        en: `${baseUrl}/en/kol`,
        'x-default': `${baseUrl}/id/kol`,
      },
    },
  };
}

export default async function KolTripsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white" spacing="lg">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Trip Eksklusif Terbatas
            </div>
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Trip Bareng KOL <span className="text-yellow-300">&</span> Influencer
            </h1>
            <p className="text-base text-white/90 sm:text-lg">
              Gabung trip seru bareng influencer & content creator favorit kamu.
              Pengalaman liburan premium dengan komunitas yang asik!
            </p>
          </div>
        </Container>
      </Section>

      {/* Trips List */}
      <Section spacing="lg">
        <Container>
          <KolTripsListClient locale={locale} />
        </Container>
      </Section>
    </div>
  );
}

