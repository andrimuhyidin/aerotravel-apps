/**
 * Incident Reports Page
 * Route: /[locale]/guide/incidents
 *
 * Halaman untuk melaporkan kejadian insiden
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { IncidentForm } from './incident-form';

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
    title: 'Laporan Insiden - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/incidents`,
    },
  };
}

export default async function GuideIncidentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get current active trip for this guide
  const { data: assignment } = await supabase
    .from('trip_guides')
    .select('trip_id')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const tripId = assignment?.trip_id;

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Laporan Insiden</h1>
        <p className="mt-1 text-sm text-slate-600">
          Laporkan kejadian insiden yang terjadi selama trip untuk keperluan dokumentasi
        </p>
      </div>

      <IncidentForm guideId={user.id} tripId={tripId} />
    </Container>
  );
}
