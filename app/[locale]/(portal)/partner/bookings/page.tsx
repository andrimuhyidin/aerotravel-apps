/**
 * Partner Bookings Page
 * Route: /[locale]/partner/bookings
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { BookingsListClient } from './bookings-list-client';

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
  
  return {
    title: 'Daftar Booking - Partner Portal',
    description: 'Lihat semua booking customer Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/bookings`,
    },
  };
}

export default async function BookingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BookingsListClient locale={locale} />;
}
