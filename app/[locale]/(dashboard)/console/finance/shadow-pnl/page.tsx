/**
 * Shadow P&L Page
 * Route: /[locale]/console/finance/shadow-pnl
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { ShadowPnLClient } from './shadow-pnl-client';

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
    title: 'Shadow P&L Report - Aero Travel',
    description: 'Laporan Laba Rugi per Trip dengan cost breakdown detail',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/finance/shadow-pnl`,
    },
  };
}

export default async function ShadowPnLPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <div className="py-6">
          <ShadowPnLClient />
        </div>
      </Container>
    </Section>
  );
}

