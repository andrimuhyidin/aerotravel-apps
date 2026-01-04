/**
 * Security & System Settings Page
 * Route: /[locale]/console/settings/security
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { SecuritySettingsClient } from './security-settings-client';

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
    title: 'Security & System Settings - Aero Travel Console',
    description: 'Kelola feature flags, system configuration, dan app info',
  };
}

export default async function SecuritySettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SecuritySettingsClient />;
}

