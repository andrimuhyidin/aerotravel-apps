/**
 * Admin License Application Detail
 * View and manage license application detail
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { LicenseApplicationDetailClient } from './license-application-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Detail Aplikasi License',
    description: 'Detail dan kelola aplikasi Guide License',
  };
}

export default async function LicenseApplicationDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if admin
  const isAdmin = ['super_admin', 'owner', 'manager', 'admin', 'ops_admin'].includes(
    user.activeRole || (user.profile as { role?: string })?.role || ''
  );

  if (!isAdmin) {
    redirect(`/${locale}/guide`);
  }

  return (
    <Section spacing="lg">
      <Container>
        <LicenseApplicationDetailClient applicationId={id} locale={locale} />
      </Container>
    </Section>
  );
}
