import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PerformanceReviewsClient } from './performance-reviews-client';

export const metadata: Metadata = {
  title: 'Performance Reviews | Admin Console',
  description: 'Employee performance evaluation management',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PerformanceReviewsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PerformanceReviewsClient locale={locale} />;
}

