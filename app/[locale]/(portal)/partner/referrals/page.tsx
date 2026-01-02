/**
 * Partner Referrals Page
 * Route: /partner/referrals
 * Track referral codes and commissions
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { ReferralsClient } from './referrals-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Referrals | Partner Portal',
  description: 'Kelola kode referral dan pantau komisi',
};

export default async function ReferralsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReferralsClient locale={locale} />;
}

