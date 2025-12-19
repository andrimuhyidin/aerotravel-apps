/**
 * SOS Page
 * Route: /[locale]/guide/sos
 *
 * Panic Button untuk keadaan darurat
 * PRD 6.1.A - Panic Button (SOS Alert System)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

import { SOSButton } from './sos-button';

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
    title: 'SOS Darurat - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/guide/sos`,
    },
  };
}

export default async function GuideSosPage({ params }: PageProps) {
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
  const { data: assignment } = (await supabase
    .from('trip_guides')
    .select('trip_id')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()) as {
    data: { trip_id: string } | null;
  };

  const tripId = assignment?.trip_id || 'no-trip';

  return (
    <Container className="py-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-600">🚨 Tombol Darurat</h1>
        <p className="mt-1 text-slate-600">Gunakan hanya dalam keadaan darurat</p>
      </div>

      <div className="mt-8">
        <SOSButton tripId={tripId} guideId={user.id} />
      </div>
    </Container>
  );
}
