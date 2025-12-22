import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getTransactionStatus } from '@/lib/integrations/midtrans';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Webhook handler untuk Midtrans payment notifications
 * Endpoint: /api/webhooks/midtrans
 * Handles both booking payments and tipping payments
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Verify signature (recommended for production)
  // const signature = request.headers.get('x-midtrans-signature');
  // if (!verifySignature(body, signature)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  // }

  const { order_id, transaction_status, fraud_status, gross_amount } = body;

  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Check if this is a tipping payment (order_id starts with "TIP-")
  const isTippingPayment = order_id?.startsWith('TIP-');

  if (isTippingPayment) {
    // Handle tipping payment
    const { data: tippingRequest } = await client
      .from('tipping_requests')
      .select('id, guide_id, amount, payment_status')
      .eq('qris_payment_id', order_id)
      .maybeSingle();

    if (!tippingRequest) {
      logger.warn('Tipping request not found for order_id', { order_id });
      return NextResponse.json({ received: true, message: 'Tipping request not found' });
    }

    switch (transaction_status) {
      case 'settlement':
        // Payment successful - update tipping request status
        // The trigger will automatically process the payment to wallet
        await client
          .from('tipping_requests')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', tippingRequest.id);

        logger.info('Tipping payment successful', {
          requestId: tippingRequest.id,
          guideId: tippingRequest.guide_id,
          amount: gross_amount,
        });

        // Send push notification to guide (handled by trigger or separate service)
        break;

      case 'pending':
        // Payment pending - no action needed
        break;

      case 'expire':
        // Payment expired
        await client
          .from('tipping_requests')
          .update({ payment_status: 'expired' })
          .eq('id', tippingRequest.id);
        break;

      case 'cancel':
        // Payment cancelled
        await client
          .from('tipping_requests')
          .update({ payment_status: 'cancelled' })
          .eq('id', tippingRequest.id);
        break;

      default:
        logger.info('Unhandled tipping transaction status', { transaction_status, order_id });
    }
  } else {
    // Handle booking payment (existing logic)
    switch (transaction_status) {
      case 'settlement':
        // Payment successful
        // TODO: Update booking status to PAID
        // TODO: Send confirmation email
        // TODO: Trigger WhatsApp notification
        break;

      case 'pending':
        // Payment pending
        // TODO: Update booking status to PENDING_PAYMENT
        break;

      case 'expire':
        // Payment expired
        // TODO: Update booking status to CANCELLED
        // TODO: Release inventory (kapal/villa slot)
        break;

      case 'cancel':
        // Payment cancelled
        // TODO: Update booking status to CANCELLED
        break;

      default:
        logger.info('Unhandled transaction status', { transaction_status });
    }
  }

  // Check fraud status
  if (fraud_status === 'accept') {
    // Transaction is safe
  } else if (fraud_status === 'deny' || fraud_status === 'challenge') {
    // Transaction flagged - manual review needed
    // TODO: Notify admin for manual review
    logger.warn('Transaction flagged for review', {
      order_id,
      fraud_status,
      transaction_status,
    });
  }

  return NextResponse.json({ received: true });
});

