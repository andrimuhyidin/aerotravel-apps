/**
 * Partner Broadcasts Page
 * Route: /partner/broadcasts
 * WhatsApp broadcast management
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { BroadcastsClient } from './broadcasts-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'WhatsApp Broadcast | Partner Portal',
  description: 'Kirim pesan massal ke customer via WhatsApp',
};

export default async function BroadcastsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BroadcastsClient locale={locale} />;
}

