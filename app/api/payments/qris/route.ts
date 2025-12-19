/**
 * API: QRIS Payment
 * POST /api/payments/qris - Create QRIS payment
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createInvoice } from '@/lib/integrations/xendit';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const createQRISSchema = z.object({
  amount: z.number().positive(),
  order_id: z.string(),
  description: z.string(),
  payer_email: z.string().email().optional(),
  payer_name: z.string().optional(),
  payer_phone: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const payload = createQRISSchema.parse(await request.json());

  try {
    // Create Xendit invoice with QRIS payment method
    const invoice = await createInvoice({
      externalId: payload.order_id,
      amount: payload.amount,
      description: payload.description,
      payerEmail: payload.payer_email,
      payerName: payload.payer_name,
      payerPhone: payload.payer_phone,
      paymentMethods: ['QRIS'],
      currency: 'IDR',
      invoiceDuration: 86400, // 24 hours
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${payload.order_id}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed?order_id=${payload.order_id}`,
    });

    // Extract QR code from invoice (Xendit provides QR code in invoice_url or separate endpoint)
    // For now, we'll use invoice_url as QR code reference
    // In production, you might need to call Xendit's QRIS-specific endpoint

    logger.info('QRIS payment created', {
      invoiceId: invoice.id,
      orderId: payload.order_id,
      amount: payload.amount,
    });

    return NextResponse.json({
      success: true,
      payment_id: invoice.id,
      qr_code: invoice.invoice_url, // Xendit invoice URL contains QR code
      qr_code_data: invoice.invoice_url, // For QR code scanner
      expires_at: invoice.expiry_date,
      invoice_url: invoice.invoice_url,
    });
  } catch (error) {
    logger.error('Failed to create QRIS payment', error, { orderId: payload.order_id });
    return NextResponse.json({ error: 'Failed to create QRIS payment' }, { status: 500 });
  }
});
