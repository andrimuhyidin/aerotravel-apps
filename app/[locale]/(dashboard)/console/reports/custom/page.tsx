import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CustomReportsClient } from './custom-reports-client';

export const metadata: Metadata = {
  title: 'Custom Reports | Admin Console',
  description: 'Build and manage custom report templates',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CustomReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomReportsClient locale={locale} />;
}

