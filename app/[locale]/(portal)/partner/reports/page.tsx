/**
 * Partner Commission Reports Page
 * Route: /[locale]/partner/reports
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { CommissionReportsClient } from './commission-reports-client';

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
    title: 'Laporan Komisi - Partner Portal',
    description: 'Lihat laporan komisi dan kinerja Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/reports`,
    },
  };
}

export default async function ReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <CommissionReportsClient locale={locale} />
      </Container>
    </Section>
  );
}

