/**
 * Guide Insights Page - Redirect to Performance
 * Route: /[locale]/guide/insights
 *
 * Insights has been merged into Performance page with tabs:
 * - Overview: Performance metrics & AI coach
 * - Insights: Monthly summary, penalties, AI recommendations
 * - Challenges: Active & completed challenges
 */

import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { locales } from '@/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function GuideInsightsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to unified performance page
  redirect(`/${locale}/guide/performance`);
}
