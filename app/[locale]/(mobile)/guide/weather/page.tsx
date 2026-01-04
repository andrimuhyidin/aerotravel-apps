/**
 * Guide Weather Page
 * Route: /[locale]/guide/weather
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { WeatherClient } from './weather-client';

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
    title: 'Cuaca & Alerts - Guide App',
    description: 'Informasi cuaca terkini, prakiraan, dan peringatan cuaca untuk perjalanan Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/weather`,
    },
  };
}

export default async function GuideWeatherPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Cuaca & Alerts</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Informasi cuaca terkini, prakiraan, dan peringatan untuk perjalanan Anda
        </p>
      </div>
      <WeatherClient locale={locale} />
    </Container>
  );
}

