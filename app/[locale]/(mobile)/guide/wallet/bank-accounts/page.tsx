/**
 * Bank Accounts Management Page
 * Halaman untuk manage bank accounts dengan approval system
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { BankAccountsClient } from './bank-accounts-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Kelola Rekening Bank - Guide App',
    description: 'Kelola rekening bank untuk penarikan dana',
  };
}

export default async function BankAccountsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Rekening Bank</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola rekening bank untuk penarikan dana. Rekening baru memerlukan persetujuan admin.
        </p>
      </div>

      <BankAccountsClient locale={locale} />
    </Container>
  );
}
