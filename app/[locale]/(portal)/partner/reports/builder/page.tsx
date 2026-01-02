/**
 * Custom Report Builder Page
 * Route: /partner/reports/builder
 * Build custom reports with drag-drop interface
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { ReportBuilderClient } from './report-builder-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Report Builder | Partner Portal',
  description: 'Buat laporan kustom sesuai kebutuhan',
};

export default async function ReportBuilderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReportBuilderClient locale={locale} />;
}

