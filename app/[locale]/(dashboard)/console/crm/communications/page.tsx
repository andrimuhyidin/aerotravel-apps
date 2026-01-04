import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CustomerCommunicationsClient } from './communications-client';

export const metadata: Metadata = {
  title: 'Customer Communications | Admin Console',
  description: 'Customer interaction logs and communications',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CustomerCommunicationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerCommunicationsClient locale={locale} />;
}

