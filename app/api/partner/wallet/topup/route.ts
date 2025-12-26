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
    const { createInvoice } = await import('@/lib/integrations/xendit');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aerotravel.co.id';
    
    const invoice = await createInvoice({
      externalId,
      amount,
      description: `Top-up Wallet - ${mitra.full_name || 'Partner'}`,
      payerEmail: mitra.email,
      payerName: mitra.full_name,
      successRedirectUrl: `${baseUrl}/partner/wallet?topup=success`,
      failureRedirectUrl: `${baseUrl}/partner/wallet?topup=failed`,
      paymentMethods: ['QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET', 'RETAIL_OUTLET'],
      invoiceDuration: 86400, // 24 hours
    });

    // Store top-up request in database for tracking
    const client = supabase as unknown as any;
    await client
      .from('mitra_wallet_transactions')
      .insert({
        mitra_id: mitraId,
        transaction_type: 'topup_pending',
        amount: amount,
        external_id: externalId,
        xendit_invoice_id: invoice.id,
        description: `Top-up request - Invoice ${invoice.id}`,
        status: 'pending',
      } as Record<string, unknown>)
      .catch((err: Error) => {
        // Non-critical - log but continue
        logger.warn('Failed to record topup transaction', {
          error: err.message,
        });
      });

    logger.info('Partner topup invoice created', {
      mitraId,
      amount,
      externalId,
      invoiceId: invoice.id,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      externalId,
      status: invoice.status,
      expiryDate: invoice.expiry_date,
    });
  } catch (error) {
    logger.error('Xendit invoice creation failed', error);
    return NextResponse.json(
      { error: 'Failed to create payment. Silakan coba lagi.' },
      { status: 500 }
    );
  }
});
