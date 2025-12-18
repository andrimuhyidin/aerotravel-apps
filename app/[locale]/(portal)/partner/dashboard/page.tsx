/**
 * Partner Dashboard Page
 * Route: /[locale]/partner/dashboard
 */

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PartnerDashboardClient } from './partner-dashboard-client';

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
    title: 'Partner Dashboard - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/dashboard`,
    },
  };
}

export default async function PartnerDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <PartnerDashboardClient />
      </Container>
    </Section>
  );
}
