/**
 * Guide Feedback Page
 * List of feedbacks submitted by guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { FeedbackListClient } from './feedback-list-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Feedback & Saran',
    description: 'Berikan feedback dan saran untuk perbaikan perusahaan',
  };
}

export default async function GuideFeedbackPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <div className="space-y-4 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              Feedback & Saran
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Berikan feedback dan saran untuk perbaikan perusahaan
            </p>
          </div>

          <FeedbackListClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
