/**
 * Guide Profile Detail Page
 * Route: /[locale]/guide/crew/[guideId]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { GuideDetailClient } from './guide-detail-client';

type PageProps = {
  params: Promise<{ locale: string; guideId: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Detail Guide - Guide App | MyAeroTravel ID',
    description: 'Detail profil tour guide',
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { locale, guideId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section>
      <Container className="py-4">
        <GuideDetailClient guideId={guideId} locale={locale} />
      </Container>
    </Section>
  );
}
