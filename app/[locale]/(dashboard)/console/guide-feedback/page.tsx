/**
 * Admin Guide Feedback Management
 * Dashboard untuk manage feedback dari guide
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { FeedbackManagementClient } from './feedback-management-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Guide Feedback Management',
    description: 'Kelola feedback dan saran dari guide',
  };
}

export default async function GuideFeedbackManagementPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if admin
  const isAdmin = ['super_admin', 'owner', 'manager', 'admin'].includes(
    user.activeRole || (user.profile as { role?: string })?.role || ''
  );

  if (!isAdmin) {
    redirect(`/${locale}/guide`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <div className="space-y-4 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              Guide Feedback Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola feedback dan saran dari guide untuk perbaikan perusahaan
            </p>
          </div>

          <FeedbackManagementClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
