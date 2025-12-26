/**
 * Partner Support Ticket Detail Page
 * Route: /[locale]/partner/support/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { TicketDetailClient } from '../ticket-detail-client';

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
    title: 'Ticket Detail - Partner Portal',
    description: 'Detail support ticket',
    alternates: {
      canonical: `${baseUrl}/${locale}/partner/support/[id]`,
    },
  };
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Section>
      <Container>
        <TicketDetailClient locale={locale} ticketId={id} />
      </Container>
    </Section>
  );
}

