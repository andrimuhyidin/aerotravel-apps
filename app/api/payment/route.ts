/**
 * Payment Gateway API dengan Feature Flag
 * Sesuai PRD 2.5.C - Feature Flagging
 */

import { NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';
import { createTransaction } from '@/lib/integrations/midtrans';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    const userId = request.headers.get('x-user-id') || undefined;
    const paymentEnabled = isFeatureEnabled('payment-gateway', userId);

    if (!paymentEnabled) {
      return NextResponse.json(
        { error: 'Payment gateway sedang dalam maintenance' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId, amount, customerDetails, itemDetails } = body;

    // Create transaction
    const transaction = await createTransaction({
      transactionDetails: {
        orderId,
        grossAmount: amount,
      },
      customerDetails,
      itemDetails,
      enabledPayments: ['qris', 'bank_transfer', 'credit_card'],
    });

    const transactionData = transaction as { token: string; redirect_url: string };
    return NextResponse.json({
      success: true,
      token: transactionData.token,
      redirectUrl: transactionData.redirect_url,
    });
  } catch (error) {
    logger.error('Payment error', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

