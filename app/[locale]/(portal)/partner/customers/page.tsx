/**
 * Partner Customers Page
 * Route: /[locale]/partner/customers
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { CustomersListClient } from './customers-list-client';

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
    title: 'Daftar Customer - Partner Portal',
    description: 'Kelola database customer Anda',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/customers`,
    },
  };
}

export default async function CustomersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <CustomersListClient locale={locale} />
      </Container>
    </Section>
  );
}

