/**
 * Guide Preferences Page
 * Route: /[locale]/guide/preferences
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { PreferencesClient } from './preferences-client';

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
  return { title: 'Preferensi Trip' };
}

export default async function GuidePreferencesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Preferensi Trip</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih preferensi Anda untuk membantu kami menugaskan trip yang sesuai
        </p>
      </div>
      <PreferencesClient locale={locale} />
    </Container>
  );
}
