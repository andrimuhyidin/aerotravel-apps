/**
 * Guide Live Tracking Page
 * Real-time GPS tracking with map visualization
 * Route: /guide/tracking
 */

import { MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { TrackingClient } from './tracking-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Live Tracking - Guide App' };
}

export default async function TrackingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: assignment } = await supabase
    .from('trip_guides')
    .select(
      `
      trip_id,
      trip:trips(
        id,
        trip_code,
        trip_date
      )
    `
    )
    .eq('guide_id', user.id)
    .order('trip_id', { ascending: true })
    .limit(1)
    .maybeSingle();

  const trip = assignment?.trip ?? null;

  if (!trip) {
    return (
      <Container className="py-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MapPin className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Tidak Ada Trip</h1>
          <p className="mt-2 text-slate-600">Anda belum memiliki penugasan trip untuk tracking.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <TrackingClient locale={locale} tripId={trip.id} tripCode={trip.trip_code ?? ''} />
    </Container>
  );
}
