/**
 * Carbon Footprint Dashboard Page
 * Route: /console/operations/sustainability/carbon-footprint
 */

import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { CarbonFootprintClient } from '../carbon-footprint-client';

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
    title: 'Carbon Footprint Report - Operations',
    description: 'Monthly carbon emissions tracking and sustainability goals',
  };
}

export default async function CarbonFootprintPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if admin
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    redirect(`/${locale}/guide`);
  }

  return (
    <Container className="py-6">
      <CarbonFootprintClient locale={locale} />
    </Container>
  );
}

