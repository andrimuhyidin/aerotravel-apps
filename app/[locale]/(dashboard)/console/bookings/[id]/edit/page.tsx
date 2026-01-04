/**
 * Edit Booking Page
 * Route: /[locale]/console/bookings/[id]/edit
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { locales } from '@/i18n';
import { createAdminClient } from '@/lib/supabase/server';

import { EditBookingClient } from './edit-booking-client';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
  
  return {
    title: 'Edit Booking - Aero Travel',
    alternates: {
      canonical: `${baseUrl}/${locale}/console/bookings/${id}/edit`,
    },
  };
}

export default async function EditBookingPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Verify booking exists
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
          <EditBookingClient bookingId={id} locale={locale} />
        </div>
      </Container>
    </Section>
  );
}

