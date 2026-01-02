/**
 * API: Partner Wallet Top-up
 * POST /api/partner/wallet/topup
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const topupSchema = z.object({
  amount: z.number().min(100000, 'Minimum top-up is Rp 100.000'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = topupSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { amount } = validation.data;

  // Get mitra info using verified partnerId
  const { data: mitra } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', partnerId)
    .single();

  if (!mitra) {
    return NextResponse.json(
      { error: 'Mitra not found' },
      { status: 404 }
    );
  }

  // Create Xendit invoice
  const externalId = `TOPUP-${partnerId.slice(0, 8)}-${Date.now()}`;

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
        mitra_id: partnerId, // Use verified partnerId
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
      partnerId,
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
