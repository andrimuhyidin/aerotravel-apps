/**
 * Guide Trip Detail Page
 * Route: /guide/trips/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { TripDetailClient } from './trip-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Detail Trip #${id} - Guide App` };
}

export default async function GuideTripDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <TripDetailClient tripId={id} locale={locale} />
    </Container>
  );
}
