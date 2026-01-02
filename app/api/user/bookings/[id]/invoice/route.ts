/**
 * User Booking Invoice API
 * GET /api/user/bookings/[id]/invoice - Download invoice PDF
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { InvoicePDF, type InvoiceData } from '@/lib/pdf/invoice';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/user/bookings/[id]/invoice
 * Generate and download invoice PDF
 */
export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('GET /api/user/bookings/[id]/invoice', { id });

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get booking with package and branch details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      total_amount,
      status,
      customer_name,
      customer_phone,
      customer_email,
      created_at,
      paid_at,
      special_requests,
      packages (
        id,
        name,
        destination,
        duration_days,
        duration_nights,
        adult_price,
        child_price,
        infant_price
      ),
      branches (
        id,
        name,
        address,
        phone,
        email
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !booking) {
    logger.warn('Booking not found', { id, userId: user.id });
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Only allow invoice download for paid/confirmed/completed bookings
  const allowedStatuses = ['paid', 'confirmed', 'completed'];
  if (!allowedStatuses.includes(booking.status)) {
    return NextResponse.json(
      { error: 'Invoice only available for paid bookings' },
      { status: 400 }
    );
  }

  // Type assertions
  const pkg = booking.packages as unknown as {
    id: string;
    name: string;
    destination: string;
    duration_days: number;
    duration_nights: number;
    adult_price: number;
    child_price: number;
    infant_price: number;
  } | null;

  const branch = booking.branches as unknown as {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  } | null;

  // Build invoice items
  const items: InvoiceData['items'] = [];

  if (pkg) {
    if (booking.adult_pax > 0) {
      items.push({
        description: `${pkg.name} - Dewasa (${pkg.duration_days}D${pkg.duration_nights}N)`,
        quantity: booking.adult_pax,
        unitPrice: pkg.adult_price || 0,
        total: (pkg.adult_price || 0) * booking.adult_pax,
      });
    }

    if (booking.child_pax > 0) {
      items.push({
        description: `${pkg.name} - Anak`,
        quantity: booking.child_pax,
        unitPrice: pkg.child_price || 0,
        total: (pkg.child_price || 0) * booking.child_pax,
      });
    }

    if (booking.infant_pax > 0) {
      items.push({
        description: `${pkg.name} - Bayi`,
        quantity: booking.infant_pax,
        unitPrice: pkg.infant_price || 0,
        total: (pkg.infant_price || 0) * booking.infant_pax,
      });
    }
  }

  // If no items calculated, use total as single line item
  if (items.length === 0) {
    items.push({
      description: pkg?.name || 'Paket Wisata',
      quantity: 1,
      unitPrice: booking.total_amount,
      total: booking.total_amount,
    });
  }

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Build invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${booking.code}`,
    invoiceDate: new Date(booking.created_at).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    dueDate: booking.trip_date
      ? new Date(booking.trip_date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined,
    companyName: branch?.name || 'MyAeroTravel',
    companyAddress: branch?.address || 'Jl. Raya Example No. 123, Jakarta',
    companyPhone: branch?.phone || '+62 812 3456 7890',
    companyEmail: branch?.email || 'info@myaerotravel.id',
    customerName: booking.customer_name || '-',
    customerPhone: booking.customer_phone || undefined,
    customerEmail: booking.customer_email || undefined,
    items,
    subtotal,
    total: booking.total_amount,
    paymentStatus: booking.status === 'paid' || booking.status === 'confirmed' ? 'paid' : 'pending',
    paymentMethod: booking.paid_at ? 'Transfer/Online Payment' : undefined,
    notes: booking.special_requests || undefined,
  };

  try {
    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(InvoicePDF({ data: invoiceData }));

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.code}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (pdfError) {
    logger.error('Failed to generate invoice PDF', pdfError);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
});

