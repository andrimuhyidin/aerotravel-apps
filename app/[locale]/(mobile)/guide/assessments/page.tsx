/**
 * Guide Assessments Page
 * Route: /[locale]/guide/assessments
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { AssessmentsClient } from './assessments-client';

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
    title: 'Assessments - Guide App',
    description: 'Self assessment dan evaluasi untuk meningkatkan kemampuan sebagai guide',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/assessments`,
    },
  };
}

export default async function AssessmentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Assessments</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Evaluasi kemampuan dan tingkatkan performa Anda sebagai guide
        </p>
      </div>
      <AssessmentsClient locale={locale} />
    </Container>
  );
}
