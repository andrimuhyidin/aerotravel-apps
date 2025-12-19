/**
 * Guide Training Modules Page
 * Route: /[locale]/guide/training
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TrainingClient } from './training-client';

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
    title: 'Training Modules - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/training`,
    },
  };
}

export default async function GuideTrainingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Training Modules</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tingkatkan skill dan pengetahuan Anda dengan modul training
        </p>
      </div>
      <TrainingClient locale={locale} />
    </Container>
  );
}

