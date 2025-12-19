/**
 * Guide Status & Availability Page
 * Route: /[locale]/guide/status
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/server';

import { StatusClient } from './status-client';

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
    title: 'Status & Jadwal Guide',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/status`,
    },
  };
}

export default async function GuideStatusPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get current active trip for this guide
  const supabase = await createClient();
  const { data: assignment } = (await supabase
    .from('trip_guides')
    .select('trip_id')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: { trip_id: string } | null;
  };

  const tripId = assignment?.trip_id;

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Status & Ketersediaan</h1>
        <p className="mt-1 text-sm text-slate-600">Atur status saat ini dan jadwal ketersediaan</p>
      </div>
      <StatusClient locale={locale} tripId={tripId} />
    </Container>
  );
}
