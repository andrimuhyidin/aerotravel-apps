/**
 * Vendors Management Page
 * Route: /[locale]/console/operations/vendors
 * Vendor database with price lock enforcement
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';

import { VendorsClient } from './vendors-client';

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
    title: 'Vendors - Aero Travel',
    description: 'Kelola vendor dan harga terkunci',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/vendors`,
    },
  };
}

export default async function VendorsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <VendorsClient locale={locale} />
      </Container>
    </Section>
  );
}
