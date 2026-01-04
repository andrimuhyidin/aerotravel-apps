/**
 * Travel Circle Detail Page
 * Route: /travel-circle/[id]
 * Access: Protected (Circle members only)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { TravelCircleDetailClient } from './travel-circle-detail-client';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Travel Circle #${id.slice(0, 8)} - Aero Travel`,
    description: 'Lihat progress nabung bareng dan kontribusi anggota',
  };
}

export default async function TravelCircleDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <TravelCircleDetailClient circleId={id} locale={locale} />;
}
