/**
 * API: Admin - Invoice Detail
 * GET /api/admin/finance/invoices/[id] - Get invoice detail
 * PATCH /api/admin/finance/invoices/[id] - Update invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = await createAdminClient();

  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        booking_id,
        customer_id,
        invoice_date,
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        status,
        items,
        notes,
        sent_at,
        paid_at,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get related data
    let customer = null;
    let booking = null;
    let createdBy = null;

    if (invoice.customer_id) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', invoice.customer_id)
        .single();
      customer = data;
    }

    if (invoice.booking_id) {
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_code, trip_date, total_amount')
        .eq('id', invoice.booking_id)
        .single();
      booking = data;
    }

    if (invoice.created_by) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', invoice.created_by)
        .single();
      createdBy = data;
    }

    return NextResponse.json({
      invoice: {
        ...invoice,
        customer,
        booking,
        created_by_detail: createdBy,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in invoice detail API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = updateInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === 'paid') {
        updateData.paid_at = now;
      }
    }

    if (parsed.data.dueDate) {
      updateData.due_date = parsed.data.dueDate;
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update invoice', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    logger.info('Invoice updated', {
      invoiceId: id,
      updatedBy: user.id,
      changes: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice berhasil diupdate',
    });
  } catch (error) {
    logger.error('Unexpected error in update invoice', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

