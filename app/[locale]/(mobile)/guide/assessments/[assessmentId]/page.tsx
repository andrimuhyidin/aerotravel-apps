/**
 * Assessment Detail Page
 * Route: /[locale]/guide/assessments/[assessmentId]
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AssessmentResultsClient } from './results/assessment-results-client';

type PageProps = {
  params: Promise<{ locale: string; assessmentId: string }>;
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
    title: 'Assessment Detail - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/assessments/detail`,
    },
  };
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { locale, assessmentId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <AssessmentResultsClient locale={locale} assessmentId={assessmentId} />
    </Container>
  );
}
