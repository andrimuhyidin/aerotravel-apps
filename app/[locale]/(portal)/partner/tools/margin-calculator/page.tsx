/**
 * Margin Calculator Page
 * Route: /partner/tools/margin-calculator
 * Interactive tool for partners to calculate profit margins
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { MarginCalculatorClient } from './margin-calculator-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Margin Calculator | Partner Portal',
  description: 'Hitung margin dan keuntungan penjualan paket wisata',
};

export default async function MarginCalculatorPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MarginCalculatorClient locale={locale} />;
}

