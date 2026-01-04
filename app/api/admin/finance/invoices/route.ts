/**
 * API: Admin - Invoices
 * GET /api/admin/finance/invoices - List all invoices
 * POST /api/admin/finance/invoices - Create new invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateInvoiceFromBooking, saveInvoice } from '@/lib/finance/invoice-generator';
import { logger } from '@/lib/utils/logger';

const createInvoiceSchema = z.object({
  bookingId: z.string().uuid(),
  taxRate: z.number().min(0).max(100).default(11),
  discountAmount: z.number().min(0).default(0),
  discountReason: z.string().optional(),
  paymentTerms: z.enum(['IMMEDIATE', 'NET 7', 'NET 14', 'NET 30']).default('NET 7'),
  notes: z.string().optional(),
});

const invoiceListSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validated = invoiceListSchema.safeParse(queryParams);
  if (!validated.success) {
    logger.warn('Invalid query params for invoices list', { errors: validated.error.issues });
    return NextResponse.json(
      { error: 'Invalid query parameters', details: validated.error.issues },
      { status: 400 }
    );
  }

  const { search = '', status = 'all', page, limit } = validated.data;
  const offset = (page - 1) * limit;

  logger.info('Fetching invoices', { filters: { search, status, page, limit } });

  try {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        booking_id,
        customer_id,
        invoice_type,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        due_date,
        status,
        paid_amount,
        paid_at,
        created_at,
        bookings(
          booking_code,
          customer_name,
          customer_email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch invoices', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in invoices API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { bookingId, taxRate, discountAmount, discountReason, paymentTerms, notes } = parsed.data;

  try {
    // Generate invoice data from booking
    const invoiceData = await generateInvoiceFromBooking(bookingId, user.id, {
      taxRate,
      discountAmount,
      discountReason,
      paymentTerms,
      notes,
    });

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Failed to generate invoice from booking' },
        { status: 400 }
      );
    }

    // Save invoice to database
    const result = await saveInvoice(invoiceData);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save invoice' },
        { status: 500 }
      );
    }

    logger.info('Invoice created', {
      invoiceId: result.id,
      invoiceNumber: result.invoiceNumber,
      bookingId,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: result,
    });
  } catch (error) {
    logger.error('Unexpected error in create invoice', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

