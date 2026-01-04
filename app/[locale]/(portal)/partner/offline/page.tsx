/**
 * Offline Page
 * Route: /partner/offline
 * Shown when user is offline
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { OfflinePageClient } from './offline-page-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Offline | Partner Portal',
  description: 'Anda sedang offline',
};

export default async function OfflinePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OfflinePageClient locale={locale} />;
}

