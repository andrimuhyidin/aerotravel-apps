/**
 * Inventory Audit Page
 * Route: /[locale]/console/operations/inventory/audit
 * Stock opname and variance tracking
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { InventoryAuditClient } from './audit-client';

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
    title: 'Stock Opname - Aero Travel',
    description: 'Audit stok inventory dan tracking variance',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/inventory/audit`,
    },
  };
}

export default async function InventoryAuditPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <InventoryAuditClient locale={locale} />
      </Container>
    </Section>
  );
}

