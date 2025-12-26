/**
 * API: Download Aggregated Invoice PDF
 * POST /api/partner/invoices/aggregated/download
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { generateAggregatedInvoicePDF } from '@/lib/pdf/aggregated-invoice';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoiceData = await request.json();

    // Generate PDF
    const pdfBuffer = await generateAggregatedInvoicePDF(invoiceData);

    logger.info('Aggregated invoice PDF generated', {
      userId: user.id,
      period: invoiceData.period,
      periodStart: invoiceData.periodStart,
      periodEnd: invoiceData.periodEnd,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-agregat-${invoiceData.period}-${invoiceData.periodStart}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate aggregated invoice PDF', error, {
      userId: user.id,
    });
    throw error;
  }
});

