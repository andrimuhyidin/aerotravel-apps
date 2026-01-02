/**
 * Gift Vouchers Page
 * Route: /partner/vouchers
 * Manage gift vouchers
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { VouchersClient } from './vouchers-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Gift Vouchers | Partner Portal',
  description: 'Kelola voucher hadiah untuk customer',
};

export default async function VouchersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VouchersClient locale={locale} />;
}

