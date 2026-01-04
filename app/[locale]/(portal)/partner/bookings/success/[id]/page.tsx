/**
 * Booking Success Page
 * Displays confirmation after successful booking creation
 */

import { Metadata } from 'next';
import { BookingSuccessClient } from './booking-success-client';

export const metadata: Metadata = {
  title: 'Booking Berhasil',
  description: 'Konfirmasi booking berhasil dibuat',
};

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function BookingSuccessPage({ params }: PageProps) {
  const { locale, id } = await params;

  return <BookingSuccessClient locale={locale} bookingId={id} />;
}
