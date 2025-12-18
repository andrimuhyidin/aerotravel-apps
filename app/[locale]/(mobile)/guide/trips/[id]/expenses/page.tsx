/**
 * Guide Expenses Input Page
 * Input pengeluaran darurat saat trip
 * Route: /guide/trips/[id]/expenses
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { ExpensesClient } from './expenses-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pengeluaran Trip #${id} - Guide App` };
}

export default async function ExpensesPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-xl font-bold">Pengeluaran Darurat</h1>
      <ExpensesClient tripId={id} locale={locale} />
    </Container>
  );
}
