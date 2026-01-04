import { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { createAdminClient } from '@/lib/supabase/server';
import { PaymentVerificationClient } from './payment-verification-client';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Detail Pembayaran - Admin Console',
  description: 'Verifikasi pembayaran customer',
};

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PaymentDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Fetch payment data server-side
  const supabase = await createAdminClient();
  
  // Fetch payment data
  const { data: payment, error } = await supabase
    .from('payments')
    .select(`
      id,
      booking_id,
      payment_code,
      amount,
      fee_amount,
      net_amount,
      payment_method,
      status,
      proof_url,
      proof_image_url,
      verification_status,
      verified_by,
      verified_at,
      verification_notes,
      paid_at,
      expired_at,
      is_manual,
      manual_entry_by,
      bank_name,
      account_number,
      payer_name,
      payer_email,
      payer_phone,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error || !payment) {
    notFound();
  }

  // Fetch booking data separately
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      customer_name,
      customer_email,
      customer_phone,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      status,
      package_id,
      created_at
    `)
    .eq('id', payment.booking_id)
    .single();

  // Fetch package data if booking exists
  let packageData = null;
  if (booking?.package_id) {
    const { data: pkg } = await supabase
      .from('packages')
      .select('id, name, destination')
      .eq('id', booking.package_id)
      .single();
    packageData = pkg;
  }

  // Get verifier info
  let verifier = null;
  if (payment.verified_by) {
    const { data: verifierData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', payment.verified_by)
      .single();
    verifier = verifierData;
  }

  // Get verification logs
  const { data: verificationLogs } = await supabase
    .from('payment_verification_logs')
    .select(`
      id,
      action,
      previous_status,
      new_status,
      notes,
      rejection_reason,
      performed_at,
      performed_by
    `)
    .eq('payment_id', id)
    .order('performed_at', { ascending: false });

  // Get performer details
  const performerIds = [...new Set((verificationLogs || [])
    .map(log => log.performed_by)
    .filter(Boolean))];

  let performersMap: Record<string, { full_name: string }> = {};
  if (performerIds.length > 0) {
    const { data: performers } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', performerIds);

    if (performers) {
      performersMap = Object.fromEntries(
        performers.map(p => [p.id, { full_name: p.full_name }])
      );
    }
  }

  const logsWithPerformer = (verificationLogs || []).map(log => ({
    ...log,
    performer: log.performed_by ? performersMap[log.performed_by] || null : null,
  }));

  // Combine payment with related data
  const paymentWithRelations = {
    ...payment,
    verifier,
    booking: booking ? {
      ...booking,
      package: packageData,
    } : null,
  };

  return (
    <Section>
      <Container>
        <PaymentVerificationClient
          locale={locale}
          payment={paymentWithRelations}
          verificationLogs={logsWithPerformer}
        />
      </Container>
    </Section>
  );
}

