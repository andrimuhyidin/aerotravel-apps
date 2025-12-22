/**
 * API: Generate QRIS for Tipping
 * GET /api/guide/wallet/qris - Generate QRIS code for digital tipping
 * POST /api/guide/wallet/qris - Create tipping request with QRIS
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createTransaction } from '@/lib/integrations/midtrans';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createTippingRequestSchema = z.object({
  tripId: z.string().uuid().optional(),
  amount: z.number().positive().optional(), // Optional preset amount
  message: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get active tipping request for this guide
  const { data: activeRequest } = await withBranchFilter(
    client.from('tipping_requests'),
    branchContext,
  )
    .select('*')
    .eq('guide_id', user.id)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeRequest && activeRequest.qris_qr_code) {
    // Check if expired
    if (activeRequest.qris_expires_at && new Date(activeRequest.qris_expires_at) < new Date()) {
      // Mark as expired
      await client
        .from('tipping_requests')
        .update({ payment_status: 'expired' })
        .eq('id', activeRequest.id);
    } else {
      return NextResponse.json({
        qris_code: activeRequest.qris_qr_code,
        qris_url: activeRequest.qris_qr_code, // QR code URL or data
        expires_at: activeRequest.qris_expires_at,
        request_id: activeRequest.id,
      });
    }
  }

  return NextResponse.json({
    qris_code: null,
    message: 'No active QRIS code. Create a new tipping request.',
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = createTippingRequestSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);

  if (!branchContext.branchId && !branchContext.isSuperAdmin) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  const client = supabase as unknown as any;

  // Get guide info
  const { data: guideInfo } = await client
    .from('users')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single();

  // Generate order ID
  const orderId = `TIP-${Date.now()}-${user.id.slice(0, 8)}`;

  // Create Midtrans QRIS transaction using Core API
  let qrisCode: string | null = null;
  let qrisUrl: string | null = null;
  let expiresAt: string | null = null;
  let midtransOrderId: string | null = null;

  try {
    const { coreApi } = await import('@/lib/integrations/midtrans');
    const amount = payload.amount || 50000; // Default 50k if not specified

    // Use Core API to charge with QRIS
    const chargeResponse = await coreApi.charge({
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: guideInfo?.full_name?.split(' ')[0] || 'Guide',
        last_name: guideInfo?.full_name?.split(' ').slice(1).join(' ') || '',
        email: guideInfo?.email || undefined,
        phone: guideInfo?.phone || undefined,
      },
      item_details: [
        {
          id: 'tip',
          price: amount,
          quantity: 1,
          name: 'Tip untuk Guide',
        },
      ],
    });

    // Extract QRIS code from response
    if (chargeResponse && typeof chargeResponse === 'object' && 'qr_string' in chargeResponse) {
      qrisCode = chargeResponse.qr_string as string;
      qrisUrl = chargeResponse.qr_string as string; // QRIS string can be used as URL
      
      // Get expiry from response or set default (24 hours)
      if ('expiry_time' in chargeResponse && chargeResponse.expiry_time) {
        expiresAt = chargeResponse.expiry_time as string;
      } else {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }
      
      midtransOrderId = orderId;
    } else if (chargeResponse && typeof chargeResponse === 'object' && 'actions' in chargeResponse) {
      // Fallback: try to get from actions
      const actions = chargeResponse.actions as Array<{ name?: string; method?: string; url?: string }>;
      const qrisAction = actions?.find((action) => action.method === 'qr_code' || action.name === 'qr-code');
      if (qrisAction && qrisAction.url) {
        qrisCode = qrisAction.url;
        qrisUrl = qrisAction.url;
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        midtransOrderId = orderId;
      }
    }
  } catch (error) {
    logger.error('Failed to create Midtrans QRIS transaction', error, {
      guideId: user.id,
      orderId,
    });
    return NextResponse.json(
      { error: 'Gagal membuat QRIS. Silakan coba lagi.' },
      { status: 500 }
    );
  }

  if (!qrisCode && !qrisUrl) {
    return NextResponse.json(
      { error: 'Gagal mendapatkan QRIS code dari Midtrans' },
      { status: 500 }
    );
  }

  // Create tipping request
  const { data: tippingRequest, error: insertError } = await withBranchFilter(
    client.from('tipping_requests'),
    branchContext,
  )
    .insert({
      guide_id: user.id,
      trip_id: payload.tripId || null,
      branch_id: branchContext.branchId,
      amount: payload.amount || 50000,
      payment_method: 'qris',
      qris_payment_id: midtransOrderId,
      qris_qr_code: qrisCode || qrisUrl,
      qris_expires_at: expiresAt,
      payment_status: 'pending',
      message: payload.message || null,
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to create tipping request', insertError, { guideId: user.id });
    return NextResponse.json(
      { error: 'Gagal membuat request tipping' },
      { status: 500 }
    );
  }

  logger.info('QRIS tipping request created', {
    requestId: tippingRequest.id,
    guideId: user.id,
    amount: payload.amount || 50000,
  });

  return NextResponse.json(
    {
      success: true,
      request_id: tippingRequest.id,
      qris_code: qrisCode || qrisUrl,
      qris_url: qrisUrl,
      expires_at: expiresAt,
      amount: payload.amount || 50000,
    },
    { status: 201 }
  );
});

