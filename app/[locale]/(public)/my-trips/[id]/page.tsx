/**
 * Trip Detail Page
 * Route: /[locale]/my-trips/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { TripDetailClient } from './trip-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, id: '' }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Detail Trip - Aero Travel',
    description: 'Lihat detail perjalanan wisata Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/my-trips/${id}`,
    },
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <TripDetailClient locale={locale} tripId={id} />;
}
