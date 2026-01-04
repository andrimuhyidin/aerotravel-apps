/**
 * Admin Guide License Management
 * Dashboard untuk manage license applications dan ID cards
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { getCurrentUser } from '@/lib/supabase/server';

import { LicenseManagementClient } from './license-management-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Guide License Management',
    description: 'Kelola aplikasi dan penerbitan Guide License',
  };
}

export default async function GuideLicenseManagementPage({ params }: PageProps) {
  const { locale } = await params;
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
        <div className="space-y-4 py-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-900">
              Guide License Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola aplikasi dan penerbitan AeroTravel Guide License (ATGL)
            </p>
          </div>

          <LicenseManagementClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
