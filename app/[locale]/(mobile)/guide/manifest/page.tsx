/**
 * Manifest Page
 * Route: /[locale]/guide/manifest
 *
 * Digital Manifest - Checklist boarding/return penumpang
 * PRD 4.4.B - Trip Merging & Manifest
 */

import { ClipboardList } from 'lucide-react';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { ManifestClient } from './manifest-client';

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
    title: 'Manifest - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/manifest`,
    },
  };
}

export default async function GuideManifestPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get one trip assignment for this guide (nearest sample)
  const { data: assignment } = await supabase
    .from('trip_guides')
    .select('trip_id, trip:trips(id, trip_code, trip_date)')
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
            <ClipboardList className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Tidak Ada Trip</h1>
          <p className="mt-2 text-slate-600">
            Anda belum memiliki penugasan trip.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold leading-tight text-slate-900">Manifest Trip</h1>
        <p className="mt-1 text-sm text-slate-600">Kelola daftar penumpang dan dokumentasi</p>
      </div>
      <ManifestClient tripId={trip.id} />
    </Container>
  );
}
