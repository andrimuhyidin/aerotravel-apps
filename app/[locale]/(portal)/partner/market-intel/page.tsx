/**
 * Market Intelligence Page
 * Route: /partner/market-intel
 * Competitor price monitoring and market analysis
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { MarketIntelClient } from './market-intel-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Market Intelligence | Partner Portal',
  description: 'Pantau harga kompetitor dan analisis pasar',
};

export default async function MarketIntelPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MarketIntelClient locale={locale} />;
}

