/**
 * Admin Booking Form
 * Route: /[locale]/console/bookings/new
 * Create manual booking (admin only)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { getCurrentUser } from '@/lib/supabase/server';

import { BookingForm } from './booking-form';

export const metadata: Metadata = {
  title: 'Buat Booking Baru - Aero Travel Console',
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewBookingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check role
  const allowedRoles = ['super_admin', 'ops_admin', 'marketing'];
  if (!user.profile?.role || !allowedRoles.includes(user.profile.role)) {
    redirect(`/${locale}`);
  }

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Buat Booking Baru</h1>
          <p className="mt-2 text-muted-foreground">
            Form booking manual untuk admin
          </p>
        </div>
        <BookingForm locale={locale} />
      </Container>
    </div>
  );
}
