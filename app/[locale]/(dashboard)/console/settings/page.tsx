/**
 * Settings Overview Page
 * Route: /[locale]/console/settings
 * Admin-only system settings dashboard
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { SettingsOverviewClient } from './settings-overview-client';

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'System Settings - Aero Travel Console',
    description:
      'Kelola pengaturan sistem global seperti branding, operasional, financial, dan lainnya',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/settings`,
    },
  };
}

export default async function ConsoleSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsOverviewClient locale={locale} />;
}
