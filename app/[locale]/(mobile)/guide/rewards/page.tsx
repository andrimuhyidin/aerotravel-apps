/**
 * Guide Rewards Dashboard Page
 * Display reward points balance, summary, and recent transactions
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';
import { RewardsDashboardClient } from './rewards-dashboard-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Reward Points - Guide App',
    description: 'Lihat saldo poin reward, riwayat transaksi, dan poin yang akan kadaluarsa',
  };
}

export default async function RewardsDashboardPage({
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

  return <RewardsDashboardClient locale={locale} />;
}

