/**
 * Bulk Booking Import Page
 * Route: /partner/bookings/import
 * Upload Excel file to create multiple bookings
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { BulkImportClient } from './bulk-import-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Bulk Import Booking | Partner Portal',
  description: 'Upload file Excel untuk membuat booking secara massal',
};

export default async function BulkImportPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BulkImportClient locale={locale} />;
}

