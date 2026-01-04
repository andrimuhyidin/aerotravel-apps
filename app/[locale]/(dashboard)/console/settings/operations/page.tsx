/**
 * Operations Settings Page
 * Route: /[locale]/console/settings/operations
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { OperationsSettingsClient } from './operations-settings-client';

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
    title: 'Operations Settings - Aero Travel Console',
    description: 'Kelola geofencing, validasi, approval limits, dan guide bonus',
  };
}

export default async function OperationsSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OperationsSettingsClient />;
}

