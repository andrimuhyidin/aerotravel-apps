/**
 * Partner Packages Page
 * Route: /[locale]/partner/packages
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { PackagesClient } from './packages-client';

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
    title: 'Paket Wisata - Partner Portal',
    description: 'Browse packages dengan harga NTA (Net Travel Agent)',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/packages`,
    },
  };
}

export default async function PartnerPackagesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <PackagesClient locale={locale} />
      </Container>
    </Section>
  );
}

