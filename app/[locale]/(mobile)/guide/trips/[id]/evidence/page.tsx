/**
 * Guide Evidence Upload Page
 * Upload foto dokumentasi & bukti trip
 * Route: /guide/trips/[id]/evidence
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { EvidenceClient } from './evidence-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Upload Dokumentasi Trip #${id} - Guide App` };
}

export default async function EvidencePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-xl font-bold">Upload Dokumentasi</h1>
      <EvidenceClient tripId={id} locale={locale} />
    </Container>
  );
}
