/**
 * PWA Settings Page
 * Route: /partner/settings/pwa
 * PWA management and offline settings
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { PwaSettingsClient } from './pwa-settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Pengaturan PWA | Partner Portal',
  description: 'Kelola pengaturan aplikasi dan penyimpanan offline',
};

export default async function PwaSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PwaSettingsClient locale={locale} />;
}

