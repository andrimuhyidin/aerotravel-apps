/**
 * Trip Management Page
 * Route: /[locale]/console/operations/trips
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { createClient, getCurrentUser, hasRole } from '@/lib/supabase/server';

import { TripsClient } from './trips-client';

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
    title: 'Trip Management - Operations',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/operations/trips`,
    },
  };
}

export default async function ConsoleOperationsTripsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  const { data: tripsData } = await client
    .from('trips')
    .select(
      `
      id,
      trip_code,
      trip_date,
      status,
      total_pax,
      package:packages(name)
    `
    )
    .order('trip_date', { ascending: false })
    .limit(50);

  const trips = (tripsData ?? []) as Array<{
    id: string;
    trip_code: string;
    trip_date: string;
    status: string;
    total_pax: number;
    package: { name: string | null } | null;
  }>;

  return (
    <Section>
      <Container>
        <div className="py-8">
          <h1 className="mb-6 text-3xl font-bold">Trip Management</h1>
          <TripsClient trips={trips} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
