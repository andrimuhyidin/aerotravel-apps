import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LoyaltyManagementClient } from './loyalty-client';

export const metadata: Metadata = {
  title: 'Loyalty Management | Admin Console',
  description: 'Manage customer loyalty points and tiers',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoyaltyManagementPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoyaltyManagementClient locale={locale} />;
}

