/**
 * API: QRIS Payment Status
 * GET /api/payments/qris/[paymentId]/status - Check payment status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getInvoiceStatus } from '@/lib/integrations/xendit';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) => {
  const { paymentId } = await params;

  try {
    const invoice = await getInvoiceStatus(paymentId);

    // Map Xendit status to our status
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      PAID: 'paid',
      SETTLED: 'paid',
      EXPIRED: 'expired',
    };

    return NextResponse.json({
      status: statusMap[invoice.status] || invoice.status.toLowerCase(),
      amount: invoice.amount,
      paid_at: invoice.status === 'PAID' || invoice.status === 'SETTLED' ? invoice.updated : null,
      invoice_url: invoice.invoice_url,
    });
  } catch (error) {
    logger.error('Failed to check QRIS payment status', error, { paymentId });
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
});
