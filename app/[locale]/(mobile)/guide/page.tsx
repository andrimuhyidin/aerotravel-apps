/**
 * Guide Dashboard Page
 * Route: /[locale]/guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { GuideDashboardClient } from './guide-dashboard-client';

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
    title: 'Guide Dashboard - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide`,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const user = await getCurrentUser();
  const userName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Guide';

  return (
    <Container className="py-4">
      <GuideDashboardClient userName={userName} locale={locale} />
    </Container>
  );
}
