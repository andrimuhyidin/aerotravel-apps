/**
 * Trip Wizard Page
 * Route: /[locale]/guide/trips/[slug]/wizard
 * Guided flow: Pre-trip -> Attendance/Manifest -> Briefing/Foto -> Completion
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TripWizardClient } from './trip-wizard-client';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Trip Wizard ${slug} - Guide App` };
}

export default async function TripWizardPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { getBranchContext } = await import('@/lib/branch/branch-injection');

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let tripQuery;
  if (isUUID) {
    tripQuery = client
      .from('trips')
      .select('id, trip_code, name')
      .eq('id', slug)
      .maybeSingle();
  } else {
    tripQuery = client
      .from('trips')
      .select('id, trip_code, name')
      .eq('trip_code', slug)
      .maybeSingle();
  }

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error: tripError } = await tripQuery;

  if (tripError || !trip) {
    redirect(`/${locale}/guide/trips`);
  }

  const { data: assignment } = await client
    .from('trip_guides')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('guide_id', user.id)
    .maybeSingle();

  if (!assignment) {
    redirect(`/${locale}/guide/trips`);
  }

  return (
    <Container className="py-4">
      <TripWizardClient
        tripId={trip.id}
        locale={locale}
        tripCode={trip.trip_code || undefined}
        tripName={trip.name || trip.trip_code || slug}
      />
    </Container>
  );
}

