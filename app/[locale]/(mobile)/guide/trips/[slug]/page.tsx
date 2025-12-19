/**
 * Guide Trip Detail Page (by Code or ID)
 * Route: /guide/trips/[slug]
 * Handles both trip code and UUID for backward compatibility
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { TripDetailClient } from './trip-detail-client';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Detail Trip ${slug} - Guide App` };
}

export default async function GuideTripDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Resolve slug (could be code or ID) to trip ID
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { getBranchContext } = await import('@/lib/branch/branch-injection');
  
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Check if slug is UUID (has dashes) or trip code
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let tripQuery;
  if (isUUID) {
    // Slug is UUID, query by ID
    tripQuery = client.from('trips')
      .select('id, trip_code')
      .eq('id', slug)
      .maybeSingle();
  } else {
    // Slug is trip code
    tripQuery = client.from('trips')
      .select('id, trip_code')
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

  // Verify guide assignment (check both trip_guides and trip_crews)
  // First check trip_crews (new multi-guide system)
  const { data: crewAssignment } = await client
    .from('trip_crews')
    .select('id, role, status')
    .eq('trip_id', trip.id)
    .eq('guide_id', user.id)
    .in('status', ['assigned', 'confirmed'])
    .maybeSingle();

  // Fallback to trip_guides (legacy single-guide system)
  const { data: legacyAssignment } = await client
    .from('trip_guides')
    .select('id, assignment_status')
    .eq('trip_id', trip.id)
    .eq('guide_id', user.id)
    .in('assignment_status', ['confirmed', 'pending_confirmation'])
    .maybeSingle();

  // Allow access if assigned via either system
  if (!crewAssignment && !legacyAssignment) {
    redirect(`/${locale}/guide/trips`);
  }
  
  return (
    <Container className="py-4">
      <TripDetailClient tripId={trip.id} locale={locale} tripCode={trip.trip_code || undefined} />
    </Container>
  );
}
