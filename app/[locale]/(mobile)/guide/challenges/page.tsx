/**
 * Guide Challenges Page
 * Route: /[locale]/guide/challenges
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { ChallengesClient } from './challenges-client';

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
    title: 'Challenges - Guide App',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/challenges`,
    },
  };
}

export default async function GuideChallengesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Challenges</h1>
        <p className="mt-1 text-sm text-slate-600">
          Raih target dan dapatkan reward untuk performa terbaik Anda
        </p>
      </div>
      <ChallengesClient locale={locale} />
    </Container>
  );
}

