/**
 * Public Booking Payment API
 * POST /api/public/bookings/payment - Create Xendit payment invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkRateLimit, getRequestIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/api/public-rate-limit';
import { createInvoice } from '@/lib/integrations/xendit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  bookingCode: z.string(),
  amount: z.number().min(1000), // Minimum IDR 1000
  payerEmail: z.string().email(),
  payerName: z.string().min(2),
  payerPhone: z.string().min(10).optional(),
  description: z.string(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const identifier = getRequestIdentifier(request);
  const rateLimit = checkRateLimit(`payment:${identifier}`, RATE_LIMIT_CONFIGS.POST);
  
  if (!rateLimit.success) {
    logger.warn('Rate limit exceeded for payment', { identifier });
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  
  // Validate input
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('Invalid payment data', { errors: parsed.error.errors });
    return NextResponse.json(
      { error: 'Invalid payment data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  logger.info('POST /api/public/bookings/payment', { 
    bookingId: data.bookingId,
    amount: data.amount,
  });

  const supabase = await createClient();

  // Verify booking exists and is in pending status
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, code, status, total_amount')
    .eq('id', data.bookingId)
    .single();

  if (bookingError || !booking) {
    logger.warn('Booking not found', { bookingId: data.bookingId });
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  if (booking.status !== 'pending') {
    logger.warn('Booking already processed', { 
      bookingId: data.bookingId, 
      status: booking.status,
    });
    return NextResponse.json(
      { error: 'Booking already processed' },
      { status: 400 }
    );
  }

  // Verify amount matches
  if (data.amount !== booking.total_amount) {
    logger.warn('Amount mismatch', { 
      requested: data.amount, 
      expected: booking.total_amount,
    });
    return NextResponse.json(
      { error: 'Payment amount does not match booking total' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';

  try {
    // Create Xendit invoice
    const invoice = await createInvoice({
      externalId: data.bookingCode,
      amount: data.amount,
      description: data.description,
      payerEmail: data.payerEmail,
      payerName: data.payerName,
      payerPhone: data.payerPhone,
      successRedirectUrl: `${appUrl}/id/payment/${data.bookingId}?status=success`,
      failureRedirectUrl: `${appUrl}/id/payment/${data.bookingId}?status=failed`,
      invoiceDuration: 86400, // 24 hours
      paymentMethods: ['QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET', 'CREDIT_CARD'],
    });

    // Store payment record
    await supabase.from('payments').insert({
      booking_id: data.bookingId,
      invoice_id: invoice.id,
      external_id: invoice.external_id,
      amount: invoice.amount,
      status: 'pending',
      payment_method: null,
      invoice_url: invoice.invoice_url,
      expiry_date: invoice.expiry_date,
      created_at: new Date().toISOString(),
    });

    // Update booking with invoice reference
    await supabase
      .from('bookings')
      .update({ 
        payment_invoice_id: invoice.id,
        payment_invoice_url: invoice.invoice_url,
      })
      .eq('id', data.bookingId);

    logger.info('Payment invoice created', { 
      bookingId: data.bookingId,
      invoiceId: invoice.id,
    });

    return NextResponse.json({
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      expiryDate: invoice.expiry_date,
      amount: invoice.amount,
    });
  } catch (error) {
    logger.error('Failed to create payment invoice', error, { 
      bookingId: data.bookingId,
    });
    return NextResponse.json(
      { error: 'Failed to create payment invoice' },
      { status: 500 }
    );
  }
});

