/**
 * Partner Contracts Page
 * Route: /partner/contracts
 * View and sign partner agreements
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { ContractsClient } from './contracts-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Contracts | Partner Portal',
  description: 'Lihat dan tanda tangani perjanjian partner',
};

export default async function ContractsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContractsClient locale={locale} />;
}

