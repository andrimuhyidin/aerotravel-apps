/**
 * API: Check Tipping Status
 * GET /api/guide/trips/[id]/tipping/[tippingId]/status - Check payment status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tippingId: string }> }
) => {
  const supabase = await createClient();
  const { id: tripId, tippingId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get tipping request
  const { data: tipping, error } = await client
    .from('tipping_requests')
    .select('*')
    .eq('id', tippingId)
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .single();

  if (error || !tipping) {
    return NextResponse.json({ error: 'Tipping request not found' }, { status: 404 });
  }

  // Check payment status with Xendit (if qris_payment_id exists)
  if (tipping.qris_payment_id && !tipping.qris_payment_id.startsWith('MOCK-')) {
    try {
      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/qris/${tipping.qris_payment_id}/status`,
      );

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        if (paymentData.status === 'paid' && tipping.payment_status !== 'paid') {
          // Update status
          await client
            .from('tipping_requests')
            .update({
              payment_status: 'paid',
              paid_at: paymentData.paid_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', tippingId);

          tipping.payment_status = 'paid';
          tipping.paid_at = paymentData.paid_at || new Date().toISOString();
        }
      }
    } catch (error) {
      logger.error('Failed to check payment status', error, { tippingId });
    }
  }

  return NextResponse.json({
    status: tipping.payment_status,
    amount: tipping.amount,
    paid_at: tipping.paid_at,
  });
});
