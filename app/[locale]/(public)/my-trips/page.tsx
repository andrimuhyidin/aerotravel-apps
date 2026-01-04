/**
 * My Trips Page
 * Route: /[locale]/my-trips
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { MyTripsClient } from './my-trips-client';

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

  const title = 'My Trips - Aero Travel';
  const description = 'Lihat dan kelola semua perjalanan wisata Anda di Aero Travel';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/my-trips`,
      languages: {
        id: `${baseUrl}/id/my-trips`,
        en: `${baseUrl}/en/my-trips`,
        'x-default': `${baseUrl}/id/my-trips`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/my-trips`,
      siteName: 'MyAeroTravel ID',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    robots: { index: false, follow: false }, // Private page
  };
}

export default async function MyTripsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MyTripsClient locale={locale} />;
}
