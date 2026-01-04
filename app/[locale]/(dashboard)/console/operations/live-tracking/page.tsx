/**
 * Operations Live Tracking Page
 * Route: /[locale]/console/operations/live-tracking
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser, hasRole } from '@/lib/supabase/server';

import { LiveTrackingClient } from './live-tracking-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  return {
    title: 'Live Tracking Guide - Operations',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/live-tracking`,
    },
  };
}

export default async function ConsoleOperationsLiveTrackingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    redirect(`/${locale}`);
  }

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="mb-6 text-3xl font-bold">Live Tracking Guide</h1>
          <LiveTrackingClient />
        </div>
      </Container>
    </Section>
  );
}
