/**
 * Payment Page - Customer Payment Flow
 * PRD 4.3.C - Payment Gateway & Auto-Verification
 *
 * Route: /payment/[id]
 * Access: Protected (Customer, owner of booking only)
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { createClient } from '@/lib/supabase/server';
import { locales } from '@/i18n';

import { PaymentClient, type Booking } from './payment-client';

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Payment Booking #${id} - Aero Travel`,
  };
}

async function getBookingData(id: string): Promise<Booking | null> {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      adult_pax,
      child_pax,
      subtotal,
      discount_amount,
      tax_amount,
      service_fee,
      total_amount,
      status,
      payment_status,
      trip_date,
      created_at,
      packages (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !booking) {
    return null;
  }

  const pkg = booking.packages as { id: string; name: string } | null;

  return {
    id: booking.id,
    bookingCode: booking.booking_code,
    packageName: pkg?.name || 'Unknown Package',
    tripDate: booking.trip_date,
    adultPax: booking.adult_pax || 0,
    childPax: booking.child_pax || 0,
    subtotal: booking.subtotal || 0,
    discount: booking.discount_amount || 0,
    tax: booking.tax_amount || 0,
    serviceFee: booking.service_fee || 0,
    totalAmount: booking.total_amount || 0,
    status: booking.status,
    paymentStatus: booking.payment_status || 'pending',
    createdAt: booking.created_at,
  };
}

async function getSnapToken(bookingId: string): Promise<string | undefined> {
  try {
    // In production, this would call the payment API to get a fresh snap token
    // For now, we'll let the client handle it via the payment button
    return undefined;
  } catch {
    return undefined;
  }
}

export default async function PaymentPage({ params }: Props) {
  const { id, locale } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/payment/${id}`);
  }

  const booking = await getBookingData(id);

  if (!booking) {
    redirect(`/${locale}/my-trips`);
  }

  // Verify booking belongs to user
  const { data: userBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', id)
    .eq('created_by', user.id)
    .single();

  if (!userBooking) {
    redirect(`/${locale}/my-trips`);
  }

  const snapToken = await getSnapToken(id);

  return (
    <Section>
      <Container>
        <div className="py-6">
          <PaymentClient booking={booking} snapToken={snapToken} />
        </div>
      </Container>
    </Section>
  );
}
