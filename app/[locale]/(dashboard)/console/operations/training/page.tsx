/**
 * Training Management Page
 * Route: /[locale]/console/operations/training
 * Hub for training programs, sessions, and compliance
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TrainingHubClient } from './training-hub-client';

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
    title: 'Training Management - Operations',
    description: 'Kelola program training, sesi pelatihan, dan sertifikasi guide',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/training`,
    },
  };
}

export default async function TrainingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check admin role
  if (user.activeRole !== 'super_admin' && user.activeRole !== 'ops_admin') {
    redirect(`/${locale}/console`);
  }

  return (
    <Section>
      <Container>
        <div className="py-6">
          <TrainingHubClient locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

