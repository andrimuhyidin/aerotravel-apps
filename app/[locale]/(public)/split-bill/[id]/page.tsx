/**
 * Split Bill Page - Digital Group Payment
 * PRD 5.1.A - Split Bill (Digital Group Payment)
 *
 * Route: /split-bill/[id]
 * Access: Public (via unique link)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { locales } from '@/i18n';
import { SplitBillClient } from './split-bill-client';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Split Bill #${id.slice(0, 8)} - Aero Travel`,
    description: 'Patungan bayar trip bareng teman dengan mudah',
  };
}

export default async function SplitBillPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <SplitBillClient splitBillId={id} locale={locale} />;
}
