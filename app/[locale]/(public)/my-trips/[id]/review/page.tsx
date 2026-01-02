/**
 * Review Page
 * Route: /[locale]/my-trips/[id]/review
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';

import { ReviewFormClient } from './review-form-client';

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
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Tulis Review - Aero Travel',
    description: 'Bagikan pengalaman perjalanan Anda',
  };
}

export default async function ReviewPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ReviewFormClient locale={locale} tripId={id} />;
}

