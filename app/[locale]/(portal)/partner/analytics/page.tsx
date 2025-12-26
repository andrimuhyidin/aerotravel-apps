/**
 * Partner Analytics Dashboard Page
 */

import { Metadata } from 'next';
import { AnalyticsClient } from './analytics-client';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Partner Portal',
  description: 'Analytics dan insights untuk partner',
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AnalyticsClient locale={locale} />;
}

