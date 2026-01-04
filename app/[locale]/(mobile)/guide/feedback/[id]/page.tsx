/**
 * Feedback Detail Page
 * View feedback detail and admin response
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { FeedbackDetailClient } from './feedback-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Detail Feedback',
    description: 'Lihat detail feedback dan response admin',
  };
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <FeedbackDetailClient feedbackId={id} locale={locale} />
      </Container>
    </Section>
  );
}
