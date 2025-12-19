/**
 * New Feedback Page
 * Form to create new feedback
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { FeedbackFormClient } from './feedback-form-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Buat Feedback Baru',
    description: 'Berikan feedback dan saran untuk perbaikan',
  };
}

export default async function NewFeedbackPage({ params }: PageProps) {
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
              Buat Feedback Baru
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Berikan feedback dan saran untuk perbaikan perusahaan
            </p>
          </div>

          <FeedbackFormClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
