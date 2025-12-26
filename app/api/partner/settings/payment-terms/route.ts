/**
 * API: Partner Payment Terms Settings
 * GET /api/partner/settings/payment-terms - Get payment terms
 * PUT /api/partner/settings/payment-terms - Update payment terms
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updatePaymentTermsSchema = z.object({
  paymentTermsType: z.enum(['prepaid', 'postpaid']).optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  autoInvoice: z.boolean().optional(),
  invoiceDueDays: z.number().int().min(0).max(365).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = supabase as unknown as any;

    // Get payment terms from users table
    const { data: profile, error: profileError } = await client
      .from('users')
      .select(
        'payment_terms_type, payment_terms_days, auto_invoice, invoice_due_days'
      )
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch payment terms', profileError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch payment terms' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentTerms: {
        paymentTermsType: profile.payment_terms_type || 'prepaid',
        paymentTermsDays: profile.payment_terms_days || 0,
        autoInvoice: profile.auto_invoice || false,
        invoiceDueDays: profile.invoice_due_days || 0,
      },
    });
  } catch (error) {
    logger.error('Error in GET /api/partner/settings/payment-terms', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = updatePaymentTermsSchema.parse(body);

    const client = supabase as unknown as any;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validated.paymentTermsType !== undefined) {
      updateData.payment_terms_type = validated.paymentTermsType;
    }
    if (validated.paymentTermsDays !== undefined) {
      updateData.payment_terms_days = validated.paymentTermsDays;
    }
    if (validated.autoInvoice !== undefined) {
      updateData.auto_invoice = validated.autoInvoice;
    }
    if (validated.invoiceDueDays !== undefined) {
      updateData.invoice_due_days = validated.invoiceDueDays;
    }

    // If payment terms type is prepaid, set days to 0
    if (validated.paymentTermsType === 'prepaid') {
      updateData.payment_terms_days = 0;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await client
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('payment_terms_type, payment_terms_days, auto_invoice, invoice_due_days')
      .single();

    if (updateError) {
      logger.error('Failed to update payment terms', updateError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to update payment terms' },
        { status: 500 }
      );
    }

    logger.info('Payment terms updated', { userId: user.id, updated });

    return NextResponse.json({
      success: true,
      paymentTerms: {
        paymentTermsType: updated.payment_terms_type || 'prepaid',
        paymentTermsDays: updated.payment_terms_days || 0,
        autoInvoice: updated.auto_invoice || false,
        invoiceDueDays: updated.invoice_due_days || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error in PUT /api/partner/settings/payment-terms', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

