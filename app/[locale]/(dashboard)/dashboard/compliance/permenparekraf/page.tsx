/**
 * Dashboard - Permenparekraf Self-Assessment Page
 * Path: /[locale]/dashboard/compliance/permenparekraf
 * Purpose: Admin page for Permenparekraf No.4/2021 self-assessment
 */

import { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { PermenparekrafDashboard } from '@/components/admin/permenparekraf-dashboard';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Self-Assessment Permenparekraf | Dashboard',
    description: 'Self-Assessment Standar Usaha Pariwisata (Permenparekraf No.4/2021)',
    alternates: {
      canonical: `${baseUrl}/${locale}/dashboard/compliance/permenparekraf`,
    },
  };
}

export default async function PermenparekrafAssessmentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is admin
  if (!user.activeRole || !['super_admin', 'ops_admin'].includes(user.activeRole)) {
    redirect(`/${locale}/console`);
  }

  return (
    <Section>
      <Container>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Self-Assessment Standar Usaha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Permenparekraf No.4 Tahun 2021 tentang Standar Usaha Pariwisata
            </p>
          </div>

          {/* Dashboard */}
          <Suspense fallback={<div className="text-sm">Memuat...</div>}>
            <PermenparekrafDashboard userId={user.id} />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}

