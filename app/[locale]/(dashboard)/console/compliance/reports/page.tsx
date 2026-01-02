/**
 * Advanced Compliance Reports Page
 * Route: /[locale]/console/compliance/reports
 * Custom report builder with export functionality
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { ComplianceReportsClient } from './reports-client';

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
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Compliance Reports - Aero Travel',
    description: 'Generate dan export laporan compliance izin usaha',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/compliance/reports`,
    },
  };
}

export default async function ComplianceReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <ComplianceReportsClient locale={locale} />
      </Container>
    </Section>
  );
}

