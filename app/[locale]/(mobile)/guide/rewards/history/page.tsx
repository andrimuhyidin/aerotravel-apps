/**
 * Guide Rewards History Page
 * Display redemption history
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';
import { RewardsHistoryClient } from './rewards-history-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Riwayat Reward - Guide App',
    description: 'Lihat riwayat penukaran reward Anda',
  };
}

export default async function RewardsHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Verify user is guide
  if (user.profile?.role !== 'guide') {
    redirect(`/${locale}/guide`);
  }

  return <RewardsHistoryClient locale={locale} />;
}

