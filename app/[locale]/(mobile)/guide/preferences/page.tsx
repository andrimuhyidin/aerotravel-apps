/**
 * Guide Preferences Page
 * Route: /[locale]/guide/preferences
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { PreferencesClient } from './preferences-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Preferences - Guide App',
    description: 'Atur preferensi kerja dan personalisasi pengalaman Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/preferences`,
    },
  };
}

export default async function PreferencesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Preferences</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Atur preferensi kerja, notifikasi, dan personalisasi pengalaman Anda
        </p>
      </div>
      <PreferencesClient locale={locale} />
    </Container>
  );
}
