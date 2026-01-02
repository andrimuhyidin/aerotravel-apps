/**
 * Travel Circle Page
 * Route: /[locale]/travel-circle
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { TravelCircleListClient } from './travel-circle-list-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  const title = 'Travel Circle - Nabung Bareng | Aero Travel';
  const description = 'Nabung bareng teman untuk liburan impian. Buat circle, ajak teman, dan kumpulkan dana bersama.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/travel-circle`,
      languages: {
        id: `${baseUrl}/id/travel-circle`,
        en: `${baseUrl}/en/travel-circle`,
        'x-default': `${baseUrl}/id/travel-circle`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/travel-circle`,
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

export default async function TravelCirclePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TravelCircleListClient locale={locale} />;
}
