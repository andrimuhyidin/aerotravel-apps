/**
 * Guide Mandatory Training Calendar Page
 * Route: /guide/training/mandatory
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { MandatoryTrainingCalendarClient } from '../mandatory-calendar-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Mandatory Trainings - Guide App',
    description: 'View your mandatory training assignments and due dates',
  };
}

export default async function MandatoryTrainingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Mandatory Trainings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Lihat training wajib yang harus Anda selesaikan
        </p>
      </div>
      <MandatoryTrainingCalendarClient locale={locale} />
    </Container>
  );
}

