/**
 * Finance Page
 * Route: /[locale]/console/finance
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { FinanceDashboardClient } from './finance-dashboard-client';

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
    title: 'Finance Dashboard - Aero Travel',
    description: 'Finance dashboard dengan P&L summary, revenue trends, dan trip performance',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/finance`,
    },
  };
}

export default async function ConsoleFinancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-6">
          <FinanceDashboardClient />
        </div>
      </Container>
    </Section>
  );
}
