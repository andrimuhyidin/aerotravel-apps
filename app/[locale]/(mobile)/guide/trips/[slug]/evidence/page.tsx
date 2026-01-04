/**
 * Guide Evidence Upload Page (by Code or ID)
 * Route: /guide/trips/[slug]/evidence
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { locales } from '@/i18n';
import { getCurrentUser } from '@/lib/supabase/server';

import { EvidenceClient } from './evidence-client';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Upload Dokumentasi Trip ${slug} - Guide App` };
}

export default async function EvidencePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Resolve slug to trip ID
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { getBranchContext } = await import('@/lib/branch/branch-injection');
  
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let tripQuery;
  if (isUUID) {
    tripQuery = client.from('trips').select('id').eq('id', slug).maybeSingle();
  } else {
    tripQuery = client.from('trips').select('id').eq('trip_code', slug).maybeSingle();
  }

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    tripQuery = tripQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: trip, error } = await tripQuery;

  if (error || !trip) {
    redirect(`/${locale}/guide/trips`);
  }

  // Verify guide assignment
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
      <h1 className="mb-4 text-xl font-bold">Upload Dokumentasi</h1>
      <EvidenceClient tripId={trip.id} locale={locale} />
    </Container>
  );
}
