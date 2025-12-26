/**
 * Partner Invoices Page
 * Route: /[locale]/partner/invoices
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { InvoicesClient } from './invoices-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Invoice - Partner Portal',
    description: 'Kelola dan unduh invoice booking',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/invoices`,
    },
  };
}

export default async function PartnerInvoicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <InvoicesClient locale={locale} />
      </Container>
    </Section>
  );
}
