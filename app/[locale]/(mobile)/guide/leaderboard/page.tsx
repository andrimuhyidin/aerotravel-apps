/**
 * Leaderboard Page
 * Route: /[locale]/guide/leaderboard
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { LeaderboardClient } from './leaderboard-client';

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
    title: 'Leaderboard Guide - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/leaderboard`,
    },
  };
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Leaderboard & Level</h1>
        <p className="mt-1 text-sm text-slate-600">
          Lihat peringkat Anda dan pelajari cara naik level
        </p>
      </div>
      <LeaderboardClient locale={locale} userId={user.id} />
    </Container>
  );
}
