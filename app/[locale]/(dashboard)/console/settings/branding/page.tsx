/**
 * Branding & Company Settings Page
 * Route: /[locale]/console/settings/branding
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { BrandingSettingsClient } from './branding-settings-client';

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
    title: 'Branding & Company Settings - Aero Travel Console',
    description: 'Kelola branding, kontak, social media, SEO, dan informasi bisnis',
  };
}

export default async function BrandingSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BrandingSettingsClient />;
}

