/**
 * Partner Support Page
 * Route: /[locale]/partner/support
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { SupportTicketsListClient } from './support-tickets-list-client';

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
    title: 'Support Tickets - Partner Portal',
    description: 'Kelola support tickets dan komunikasi dengan tim Aero',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/support`,
    },
  };
}

export default async function SupportPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <SupportTicketsListClient locale={locale} />
      </Container>
    </Section>
  );
}

