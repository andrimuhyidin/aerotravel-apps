/**
 * Equipment Checklist Page
 * Route: /[locale]/guide/trips/[slug]/equipment
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { EquipmentChecklistClient } from './equipment-checklist-client';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return {
    title: 'Equipment Checklist - Guide App',
  };
}

export default async function EquipmentChecklistPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Resolve slug to tripId (simplified - in real app, fetch from API)
  const tripId = slug;

  return (
    <Section spacing="lg">
      <Container>
        <EquipmentChecklistClient tripId={tripId} locale={locale} />
      </Container>
    </Section>
  );
}

