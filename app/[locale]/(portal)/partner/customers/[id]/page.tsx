/**
 * Partner Customer Detail Page
 * Route: /[locale]/partner/customers/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { CustomerDetailClient } from '../customer-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: 'Detail Customer - Partner Portal',
    description: 'Detail customer dan riwayat booking',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/customers/[id]`,
    },
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <CustomerDetailClient locale={locale} customerId={id} />
      </Container>
    </Section>
  );
}

