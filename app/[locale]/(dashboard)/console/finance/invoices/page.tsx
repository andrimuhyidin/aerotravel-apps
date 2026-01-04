import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { InvoicesListClient } from './invoices-list-client';

export const metadata: Metadata = {
  title: 'Invoices | Admin Console',
  description: 'Invoice management and generation',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function InvoicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <InvoicesListClient locale={locale} />;
}

