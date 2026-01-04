/**
 * API: Digital Tipping
 * GET /api/guide/trips/[id]/tipping - Get tipping QR code
 * POST /api/guide/trips/[id]/tipping - Create tipping request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createTippingSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'qris']).default('cash'),
  message: z.string().optional(),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  guest_email: z.string().email().optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const resolvedParams = await params;
  const { id: tripId } = resolvedParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get all tipping requests for this trip (not just pending)
  const { data: tippings, error } = await client
    .from('tipping_requests')
    .select('*')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch tipping requests', error, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch tipping requests' }, { status: 500 });
  }

  // Transform for response
  const tippingList = (tippings || []).map((t: any) => ({
    id: t.id,
    amount: t.amount,
    payment_method: t.payment_method,
    qr_code: t.qris_qr_code,
    expires_at: t.qris_expires_at,
    payment_status: t.payment_status,
    paid_at: t.paid_at,
    guest_name: t.guest_name,
    message: t.message,
    created_at: t.created_at,
  }));

  return NextResponse.json({
    tipping: tippingList.length > 0 ? tippingList[0] : null,
    all_tippings: tippingList,
  });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId } = await params;
  const payload = createTippingSchema.parse(await request.json());

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

  // Verify trip belongs to guide
  const { data: trip } = await client
    .from('trips')
    .select('id, trip_code')
    .eq('id', tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  // Generate QRIS payment only if payment_method is 'qris'
  let qrisPaymentId: string | null = null;
  let qrisQrCode: string | null = null;
  let qrisExpiresAt: string | null = null;
  let paymentStatus: 'pending' | 'paid' = 'pending';
  let paidAt: string | null = null;

  if (payload.payment_method === 'qris') {
    try {
      // Call QRIS payment API (uses Xendit)
      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/qris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payload.amount,
          order_id: `TIP-${tripId}-${Date.now()}`,
          description: `Tipping untuk trip ${trip.trip_code}`,
          payer_email: payload.guest_email,
          payer_name: payload.guest_name,
          payer_phone: payload.guest_phone,
        }),
      });

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        qrisPaymentId = paymentData.payment_id || null;
        qrisQrCode = paymentData.qr_code || paymentData.invoice_url || null;
        qrisExpiresAt = paymentData.expires_at || null;
        paymentStatus = 'pending'; // QRIS starts as pending
      } else {
        const errorData = await paymentResponse.json().catch(() => ({}));
        logger.error('Failed to create QRIS payment', { tripId, error: errorData });
        // Don't throw, allow cash fallback or manual entry
      }
    } catch (qrError) {
      logger.warn('Failed to generate QRIS, allowing manual entry', { tripId, error: qrError });
      // Continue with manual entry option
    }
  } else if (payload.payment_method === 'cash') {
    // Cash payment is immediately marked as paid
    paymentStatus = 'paid';
    paidAt = new Date().toISOString();
  }

  // Create tipping request
  const { data: tipping, error } = await withBranchFilter(
    client.from('tipping_requests'),
    branchContext,
  )
    .insert({
      trip_id: tripId,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      amount: payload.amount,
      currency: 'IDR',
      message: payload.message || null,
      payment_method: payload.payment_method || 'cash',
      qris_payment_id: qrisPaymentId,
      qris_qr_code: qrisQrCode,
      qris_expires_at: qrisExpiresAt,
      payment_status: paymentStatus,
      paid_at: paidAt,
      guest_name: payload.guest_name || null,
      guest_phone: payload.guest_phone || null,
      guest_email: payload.guest_email || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create tipping request', error, { guideId: user.id, tripId });
    return NextResponse.json({ error: 'Failed to create tipping request' }, { status: 500 });
  }

  logger.info('Tipping request created', {
    tippingId: tipping.id,
    tripId,
    amount: payload.amount,
  });

  return NextResponse.json(
    {
      success: true,
      tipping: {
        id: tipping.id,
        amount: tipping.amount,
        qr_code: tipping.qris_qr_code,
        expires_at: tipping.qris_expires_at,
        payment_status: tipping.payment_status,
      },
    },
    { status: 201 },
  );
});
