/**
 * Contract Sign Page
 * Route: /partner/contracts/:id/sign
 * E-signature for partner contracts
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { ContractSignClient } from './contract-sign-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale, id: 'placeholder' }));
}

export const metadata: Metadata = {
  title: 'Tanda Tangan Kontrak | Partner Portal',
  description: 'Tanda tangani perjanjian partner secara digital',
};

export default async function ContractSignPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ContractSignClient locale={locale} contractId={id} />;
}

