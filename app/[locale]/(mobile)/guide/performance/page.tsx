/**
 * Guide Performance Page
 * Route: /[locale]/guide/performance
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { PerformanceClient } from './performance-client';

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
    title: 'Performance - Guide App',
    description: 'Lihat performa dan analytics untuk meningkatkan kualitas sebagai guide',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/performance`,
    },
  };
}

export default async function PerformancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Performance</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Analisis performa dan track progress untuk meningkatkan kualitas sebagai guide
        </p>
      </div>
      <PerformanceClient locale={locale} />
    </Container>
  );
}
