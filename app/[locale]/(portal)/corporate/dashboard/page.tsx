/**
 * Corporate Dashboard Page
 * Route: /[locale]/corporate/dashboard
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';

import { CorporateDashboardClient } from './dashboard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Dashboard - Corporate Portal',
    description: 'Dashboard Corporate Portal Aero Travel',
  };
}

export default async function CorporateDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      <CorporateDashboardClient locale={locale} />
    </Container>
  );
}

