/**
 * Customer Lifetime Value Dashboard Page
 * Route: /partner/analytics/clv
 * Analyze customer value and churn risk
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { CLVDashboardClient } from './clv-dashboard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Customer Lifetime Value | Partner Portal',
  description: 'Analisis nilai pelanggan dan risiko churn',
};

export default async function CLVPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CLVDashboardClient locale={locale} />;
}

