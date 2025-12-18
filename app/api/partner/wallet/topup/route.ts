/**
 * API: Partner Wallet Top-up
 * POST /api/partner/wallet/topup
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = await request.json();

  const { mitraId, amount } = body;

  if (!mitraId || !amount || amount < 100000) {
    return NextResponse.json(
      { error: 'Invalid request. Minimum top-up is Rp 100.000' },
      { status: 400 }
    );
  }

  // Get mitra info
  const { data: mitra } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', mitraId)
    .single();

  if (!mitra) {
    return NextResponse.json(
      { error: 'Mitra not found' },
      { status: 404 }
    );
  }

  // Create Xendit invoice
  const externalId = `TOPUP-${mitraId.slice(0, 8)}-${Date.now()}`;

  try {
    // TODO: Implement actual Xendit API call
    // For now, return mock data
    const paymentUrl = `https://checkout.xendit.co/web/${externalId}`;

    // Log topup request
    logger.info('Partner topup request created', {
      mitraId,
      amount,
      externalId,
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      externalId,
    });
  } catch (error) {
    logger.error('Xendit invoice creation failed', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
});
