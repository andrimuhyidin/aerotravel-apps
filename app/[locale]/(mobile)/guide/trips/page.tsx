/**
 * Guide Trips List Page
 * Route: /[locale]/guide/trips
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { TripsClient } from './trips-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Daftar Trip - Guide App' };
}

export default async function GuideTripsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Daftar Trip Saya</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola dan lihat detail semua trip yang ditugaskan
        </p>
      </div>
      <TripsClient locale={locale} />
    </Container>
  );
}
