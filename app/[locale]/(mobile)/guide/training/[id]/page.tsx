/**
 * Training Module Detail Page
 * Route: /[locale]/guide/training/[id]
 * Redirects to training list if module not found or shows module content
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TrainingModuleDetailClient } from './training-module-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: 'Detail Training Module - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/training`,
    },
  };
}

export default async function TrainingModuleDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <TrainingModuleDetailClient locale={locale} moduleId={id} />
    </Container>
  );
}

