/**
 * Corporate New Booking Page
 * Route: /[locale]/corporate/bookings/new
 * Multi-step booking wizard for corporate employees
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { BookingWizardClient } from './booking-wizard-client';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ packageId?: string }>;
};

export const metadata: Metadata = {
  title: 'Booking Baru - Corporate Portal',
  description: 'Buat booking perjalanan baru untuk corporate',
};

export default async function NewCorporateBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { packageId } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="p-4">
      <BookingWizardClient locale={locale} initialPackageId={packageId} />
    </div>
  );
}

