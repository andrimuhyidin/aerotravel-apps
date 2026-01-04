/**
 * Split Bill Detail API
 * GET /api/split-bill/[id] - Get split bill details
 * PATCH /api/split-bill/[id] - Update participant payment status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;

  logger.info('GET /api/split-bill/[id]', { id });

  const supabase = await createClient();

  const { data: splitBill, error } = await supabase
    .from('split_bills')
    .select(`
      id,
      booking_id,
      creator_name,
      creator_phone,
      total_amount,
      split_count,
      amount_per_person,
      status,
      paid_count,
      expires_at,
      created_at,
      split_bill_participants (
        id,
        name,
        phone,
        email,
        amount,
        is_paid,
        paid_at,
        payment_url,
        created_at
      ),
      bookings (
        id,
        booking_code,
        customer_name,
        total_amount,
        status,
        packages (
          id,
          name,
          destination,
          duration_days,
          duration_nights
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !splitBill) {
    return NextResponse.json(
      { error: 'Split bill not found' },
      { status: 404 }
    );
  }

  // Calculate remaining time
  const expiresAt = new Date(splitBill.expires_at);
  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  const isExpired = remainingMs <= 0;

  // Sort participants by paid status
  const participants = splitBill.split_bill_participants as {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    amount: number;
    is_paid: boolean;
    paid_at: string | null;
    payment_url: string | null;
    created_at: string;
  }[];

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.is_paid && !b.is_paid) return -1;
    if (!a.is_paid && b.is_paid) return 1;
    return 0;
  });

  const booking = splitBill.bookings as {
    id: string;
    booking_code: string;
    customer_name: string;
    total_amount: number;
    status: string;
    packages: {
      id: string;
      name: string;
      destination: string;
      duration_days: number;
      duration_nights: number;
    } | null;
  } | null;

  return NextResponse.json({
    id: splitBill.id,
    bookingId: splitBill.booking_id,
    creatorName: splitBill.creator_name,
    creatorPhone: splitBill.creator_phone,
    totalAmount: Number(splitBill.total_amount),
    splitCount: splitBill.split_count,
    amountPerPerson: Number(splitBill.amount_per_person),
    status: splitBill.status,
    paidCount: splitBill.paid_count || 0,
    expiresAt: splitBill.expires_at,
    remainingMs: isExpired ? 0 : remainingMs,
    isExpired,
    createdAt: splitBill.created_at,
    participants: sortedParticipants,
    booking: booking ? {
      id: booking.id,
      bookingCode: booking.booking_code,
      customerName: booking.customer_name,
      totalAmount: Number(booking.total_amount),
      status: booking.status,
      package: booking.packages ? {
        name: booking.packages.name,
        destination: booking.packages.destination,
        duration: `${booking.packages.duration_days}H${booking.packages.duration_nights}M`,
      } : null,
    } : null,
  });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  const body = await request.json();
  const { participantId, isPaid } = body;

  logger.info('PATCH /api/split-bill/[id]', { id, participantId, isPaid });

  if (!participantId) {
    return NextResponse.json(
      { error: 'Participant ID is required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify split bill exists
  const { data: splitBill, error: sbError } = await supabase
    .from('split_bills')
    .select('id, status, paid_count, split_count')
    .eq('id', id)
    .single();

  if (sbError || !splitBill) {
    return NextResponse.json(
      { error: 'Split bill not found' },
      { status: 404 }
    );
  }

  // Update participant
  const updateData: Record<string, unknown> = {
    is_paid: isPaid,
  };

  if (isPaid) {
    updateData.paid_at = new Date().toISOString();
  } else {
    updateData.paid_at = null;
  }

  const { error: updateError } = await supabase
    .from('split_bill_participants')
    .update(updateData)
    .eq('id', participantId)
    .eq('split_bill_id', id);

  if (updateError) {
    logger.error('Failed to update participant', updateError);
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }

  // Update split bill paid count
  const { data: paidParticipants } = await supabase
    .from('split_bill_participants')
    .select('id')
    .eq('split_bill_id', id)
    .eq('is_paid', true);

  const paidCount = paidParticipants?.length || 0;
  const newStatus = paidCount === splitBill.split_count ? 'completed' : 'pending';

  await supabase
    .from('split_bills')
    .update({
      paid_count: paidCount,
      status: newStatus,
    })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    paidCount,
    status: newStatus,
  });
});

