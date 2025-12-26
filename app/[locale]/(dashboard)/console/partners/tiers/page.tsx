/**
 * Partner Tier Management Page
 * Admin interface for managing partner tiers
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { TiersClient } from './tiers-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Partner Tier Management',
    description: 'Manage partner tiers and view tier calculations',
  };
}

export default async function PartnerTiersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="py-8">
      <Container>
        <TiersClient locale={locale} />
      </Container>
    </Section>
  );
}

