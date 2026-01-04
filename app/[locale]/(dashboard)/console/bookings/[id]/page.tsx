/**
 * Booking Detail Page
 * Route: /[locale]/console/bookings/[id]
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient } from '@/lib/supabase/server';

import { BookingDetailClient } from './booking-detail-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
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
    title: 'Booking Details - Aero Console',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/bookings/[id]`,
    },
  };
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager', 'marketing']);
  if (!allowed) {
    redirect(`/${locale}/console`);
  }

  // Verify booking exists using admin client to bypass RLS
  const supabase = await createAdminClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', id)
    .single();

  if (!booking) {
    notFound();
  }

  return (
    <Section>
      <Container>
        <div className="py-6">
          <BookingDetailClient bookingId={id} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

