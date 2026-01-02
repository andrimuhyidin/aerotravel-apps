/**
 * New Broadcast Page
 * Route: /partner/broadcasts/new
 * Create a new WhatsApp broadcast campaign
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { BroadcastComposerClient } from './broadcast-composer-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Buat Broadcast | Partner Portal',
  description: 'Buat campaign broadcast WhatsApp baru',
};

export default async function NewBroadcastPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BroadcastComposerClient locale={locale} />;
}

