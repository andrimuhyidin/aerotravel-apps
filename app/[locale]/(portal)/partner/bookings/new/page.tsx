/**
 * Partner Booking Wizard Page
 * Route: /[locale]/partner/bookings/new
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { BookingFlowClient } from './booking-flow-client';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ packageId?: string }>;
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
    title: 'Buat Booking - Partner Portal',
    description: 'Buat booking baru untuk customer Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/bookings/new`,
    },
  };
}

export default async function NewBookingPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { packageId } = await searchParams;
  setRequestLocale(locale);

  return <BookingFlowClient locale={locale} preselectedPackageId={packageId} />;
}

