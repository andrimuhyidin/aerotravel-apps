/**
 * Guide Onboarding Page
 * Route: /[locale]/guide/onboarding
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { OnboardingClient } from './onboarding-client';

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
    title: 'Onboarding - Guide App',
    description: 'Lengkapi onboarding untuk memulai perjalanan sebagai guide',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/onboarding`,
    },
  };
}

export default async function OnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">Onboarding</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Lengkapi langkah-langkah onboarding untuk memulai perjalanan sebagai guide
        </p>
      </div>
      <OnboardingClient locale={locale} />
    </Container>
  );
}
