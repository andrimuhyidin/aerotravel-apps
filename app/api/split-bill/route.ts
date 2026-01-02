/**
 * Split Bill API
 * POST /api/split-bill - Create a new split bill
 * GET /api/split-bill - Get split bill by booking ID
 * 
 * PRD 5.1.A - Split Bill (Patungan Digital)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  logger.info('GET /api/split-bill', { bookingId });

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Booking ID is required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: splitBill, error } = await supabase
    .from('split_bills')
    .select(`
      *,
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
        status
      )
    `)
    .eq('booking_id', bookingId)
    .single();

  if (error || !splitBill) {
    return NextResponse.json(
      { error: 'Split bill not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(splitBill);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`splitbill:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for split-bill', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { bookingId, participants, creatorName, creatorPhone } = body;

  logger.info('POST /api/split-bill', { bookingId, participantCount: participants?.length });

  // Check feature flag
  const splitBillEnabled = isFeatureEnabled('split-bill', 'public');
  if (!splitBillEnabled) {
    return NextResponse.json(
      { error: 'Fitur Split Bill sedang tidak tersedia' },
      { status: 503 }
    );
  }

  if (!bookingId || !participants || !Array.isArray(participants) || participants.length < 2) {
    return NextResponse.json(
      { error: 'Booking ID dan minimal 2 participants diperlukan' },
      { status: 400 }
    );
  }

  if (!creatorName || !creatorPhone) {
    return NextResponse.json(
      { error: 'Creator name and phone are required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get booking info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, booking_code, total_amount, status, customer_name')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: 'Booking is not in pending status' },
      { status: 400 }
    );
  }

  // Calculate split
  const totalAmount = Number(booking.total_amount);
  const splitCount = participants.length;
  const amountPerPerson = Math.ceil(totalAmount / splitCount);

  // Create split bill with 24 hour expiry
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data: splitBill, error: splitBillError } = await supabase
    .from('split_bills')
    .insert({
      booking_id: bookingId,
      creator_name: creatorName,
      creator_phone: creatorPhone,
      total_amount: totalAmount,
      split_count: splitCount,
      amount_per_person: amountPerPerson,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (splitBillError || !splitBill) {
    logger.error('Failed to create split bill', splitBillError);
    return NextResponse.json(
      { error: 'Failed to create split bill' },
      { status: 500 }
    );
  }

  // Create participants
  const participantsToInsert = participants.map((p: { name: string; phone?: string; email?: string; amount?: number }) => ({
    split_bill_id: splitBill.id,
    name: p.name,
    phone: p.phone || null,
    email: p.email || null,
    amount: p.amount || amountPerPerson,
    is_paid: false,
    // Generate unique payment URL (in production, this would be a Midtrans link)
    payment_url: `/split-bill/${splitBill.id}/pay/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }));

  const { data: createdParticipants, error: participantsError } = await supabase
    .from('split_bill_participants')
    .insert(participantsToInsert)
    .select();

  if (participantsError) {
    logger.error('Failed to create participants', participantsError);
    // Rollback split bill
    await supabase.from('split_bills').delete().eq('id', splitBill.id);
    return NextResponse.json(
      { error: 'Failed to create participants' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: splitBill.id,
    bookingCode: booking.booking_code,
    totalAmount,
    splitCount,
    amountPerPerson,
    expiresAt: splitBill.expires_at,
    participants: createdParticipants,
    shareUrl: `/split-bill/${splitBill.id}`,
  });
});
