/**
 * Purchase Gift Voucher Page
 * Route: /partner/vouchers/purchase
 * Buy a gift voucher for customer
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { VoucherPurchaseClient } from './voucher-purchase-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Beli Gift Voucher | Partner Portal',
  description: 'Beli voucher hadiah untuk customer',
};

export default async function VoucherPurchasePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VoucherPurchaseClient locale={locale} />;
}

