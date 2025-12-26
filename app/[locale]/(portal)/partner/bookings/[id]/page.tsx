/**
 * Partner Booking Detail Page
 * Route: /[locale]/partner/bookings/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { BookingDetailClient } from './booking-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: 'Detail Booking - Partner Portal',
    description: 'Detail booking customer',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/bookings/[id]`,
    },
  };
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <BookingDetailClient locale={locale} bookingId={id} />
      </Container>
    </Section>
  );
}

