/**
 * Financial Settings Page
 * Route: /[locale]/console/settings/financial
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { FinancialSettingsClient } from './financial-settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Financial Settings - Aero Travel Console',
    description: 'Kelola finance, loyalty, partner rewards, dan payment settings',
  };
}

export default async function FinancialSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FinancialSettingsClient />;
}

