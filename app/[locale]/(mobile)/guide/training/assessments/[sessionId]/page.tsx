/**
 * Training Assessment Page
 * Route: /guide/training/assessments/[sessionId]
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AssessmentClient } from './assessment-client';

type PageProps = {
  params: Promise<{ locale: string; sessionId: string }>;
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
    title: 'Training Assessment - Guide App',
    description: 'Complete post-training assessment',
  };
}

export default async function AssessmentPage({ params }: PageProps) {
  const { locale, sessionId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Training Assessment</h1>
        <p className="mt-1 text-sm text-slate-600">
          Complete self-rating and quiz to finish this training
        </p>
      </div>
      <AssessmentClient sessionId={sessionId} locale={locale} />
    </Container>
  );
}

