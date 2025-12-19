/**
 * Crew Directory Page
 * Route: /[locale]/guide/crew/directory
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { CrewDirectoryClient } from './crew-directory-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Crew Directory - Guide App' };
}

export default async function CrewDirectoryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Crew Directory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cari dan hubungi rekan guide yang tersedia
        </p>
      </div>
      <CrewDirectoryClient locale={locale} />
    </Container>
  );
}
