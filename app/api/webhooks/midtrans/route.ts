import { NextRequest, NextResponse } from 'next/server';
import { getTransactionStatus } from '@/lib/integrations/midtrans';

/**
 * Webhook handler untuk Midtrans payment notifications
 * Endpoint: /api/webhooks/midtrans
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify signature (recommended for production)
    // const signature = request.headers.get('x-midtrans-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { order_id, transaction_status, fraud_status } = body;

    // Handle different transaction statuses
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
        console.log('Unhandled transaction status:', transaction_status);
    }

    // Check fraud status
    if (fraud_status === 'accept') {
      // Transaction is safe
    } else if (fraud_status === 'deny' || fraud_status === 'challenge') {
      // Transaction flagged - manual review needed
      // TODO: Notify admin for manual review
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

