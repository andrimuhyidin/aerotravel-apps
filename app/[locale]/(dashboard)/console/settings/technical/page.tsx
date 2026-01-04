/**
 * Technical Settings Page
 * Route: /[locale]/console/settings/technical
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { TechnicalSettingsClient } from './technical-settings-client';

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
    title: 'Technical Settings - Aero Travel Console',
    description: 'Kelola AI, Maps, Weather, Rate Limits, dan integrations',
  };
}

export default async function TechnicalSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TechnicalSettingsClient locale={locale} />;
}

