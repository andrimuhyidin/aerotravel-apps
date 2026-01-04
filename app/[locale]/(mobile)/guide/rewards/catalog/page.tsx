/**
 * Guide Rewards Catalog Page
 * Browse and redeem rewards
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';
import { RewardsCatalogClient } from './rewards-catalog-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Katalog Reward - Guide App',
    description: 'Tukar poin reward Anda dengan berbagai reward menarik',
  };
}

export default async function RewardsCatalogPage({
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

  return <RewardsCatalogClient locale={locale} />;
}

