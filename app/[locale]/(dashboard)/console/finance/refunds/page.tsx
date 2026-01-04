import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { RefundsListClient } from './refunds-list-client';

export const metadata: Metadata = {
  title: 'Refunds | Admin Console',
  description: 'Manage refund requests and processing',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RefundsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RefundsListClient locale={locale} />;
}

