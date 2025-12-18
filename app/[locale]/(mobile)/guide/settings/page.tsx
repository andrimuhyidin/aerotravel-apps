/**
 * Guide Settings Page
 * Pengaturan aplikasi untuk guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { SettingsClient } from './settings-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Pengaturan - Guide App' };
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <SettingsClient locale={locale} />
    </Container>
  );
}
