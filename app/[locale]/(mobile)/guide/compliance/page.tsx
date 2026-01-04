/**
 * Guide Compliance Education Page
 * Route: /guide/compliance
 * Educational page explaining compliance standards and why procedures are strict
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { ComplianceEducationClient } from './compliance-education-client';

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
  return {
    title: 'Compliance Education - Guide App',
    description: 'Pelajari mengapa aplikasi ini memiliki banyak prosedur compliance dan standar yang diikuti',
  };
}

export default async function ComplianceEducationPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <Container className="py-4">
      <ComplianceEducationClient locale={locale} />
    </Container>
  );
}

