/**
 * Manifest Page
 * Route: /[locale]/guide/manifest
 *
 * Digital Manifest - Checklist boarding/return penumpang
 * PRD 4.4.B - Trip Merging & Manifest
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Manifest - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/manifest`,
    },
  };
}

export default async function GuideManifestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to trips page - manifest is now integrated in trip detail
  redirect(`/${locale}/guide/trips`);
}
