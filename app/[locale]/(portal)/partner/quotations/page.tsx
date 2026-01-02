/**
 * Quotation Copilot Page
 * Route: /[locale]/partner/quotations
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { QuotationCopilotClient } from './quotation-copilot-client';

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
  themeColor: '#ea580c',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'AI Quotation Copilot - Partner Portal',
    description: 'Generate quotation dari natural language dengan AI',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/quotations`,
    },
  };
}

export default async function QuotationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-6">
      <QuotationCopilotClient />
    </Container>
  );
}

