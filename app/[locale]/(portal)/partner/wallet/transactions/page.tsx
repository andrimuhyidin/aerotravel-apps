/**
 * Partner Wallet Transactions Page
 * Route: /[locale]/partner/wallet/transactions
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { TransactionsClient } from './transactions-client';

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
    title: 'Riwayat Transaksi - Partner Portal',
    description: 'Lihat riwayat transaksi wallet Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/wallet/transactions`,
    },
  };
}

export default async function WalletTransactionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <TransactionsClient locale={locale} />
      </Container>
    </Section>
  );
}

