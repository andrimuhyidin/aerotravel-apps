/**
 * Content Settings Page
 * Route: /[locale]/console/settings/content
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { ContentSettingsClient } from './content-settings-client';

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
    title: 'Content Settings - Aero Travel Console',
    description: 'Kelola email templates, notification templates, legal pages, FAQs, dan landing pages',
  };
}

export default async function ContentSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContentSettingsClient />;
}

