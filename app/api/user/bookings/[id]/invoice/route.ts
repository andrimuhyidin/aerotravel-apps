/**
 * User Booking Invoice API
 * GET /api/user/bookings/[id]/invoice - Download invoice PDF
 * 
 * Note: Customer bookings are linked via customer_email (not user_id)
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

  // Get current user with email
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get booking with price snapshot - verify ownership via customer_email OR created_by
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_code,
      trip_date,
      adult_pax,
      child_pax,
      infant_pax,
      price_per_adult,
      price_per_child,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      status,
      customer_name,
      customer_phone,
      customer_email,
      created_at,
      special_requests,
      package_id,
      branch_id
    `)
    .eq('id', id)
    .or(`customer_email.eq.${user.email},created_by.eq.${user.id}`)
    .is('deleted_at', null)
    .single();

  if (error || !booking) {
    logger.warn('Booking not found', { id, email: user.email });
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

  // Fetch package for name/destination info
  let pkg: {
    id: string;
    name: string;
    destination: string;
    duration_days: number;
    duration_nights: number;
  } | null = null;

  // Fetch branch for company info
  let branch: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null = null;

  if (booking.package_id) {
    const { data: packageData } = await supabase
      .from('packages')
      .select('id, name, destination, duration_days, duration_nights')
      .eq('id', booking.package_id)
      .single();
    pkg = packageData;
  }

  if (booking.branch_id) {
    const { data: branchData } = await supabase
      .from('branches')
      .select('id, name, address, phone, email')
      .eq('id', booking.branch_id)
      .single();
    branch = branchData;
  }

  // Build invoice items using booking price snapshot (not package prices)
  const items: InvoiceData['items'] = [];
  const adultPrice = Number(booking.price_per_adult) || 0;
  const childPrice = Number(booking.price_per_child) || 0;
  const infantPrice = 0; // Usually free or included

  if (booking.adult_pax > 0) {
    items.push({
      description: `${pkg?.name || 'Paket Wisata'} - Dewasa${pkg ? ` (${pkg.duration_days}D${pkg.duration_nights}N)` : ''}`,
      quantity: booking.adult_pax,
      unitPrice: adultPrice,
      total: adultPrice * booking.adult_pax,
    });
  }

  if (booking.child_pax > 0) {
    items.push({
      description: `${pkg?.name || 'Paket Wisata'} - Anak`,
      quantity: booking.child_pax,
      unitPrice: childPrice,
      total: childPrice * booking.child_pax,
    });
  }

  if (booking.infant_pax > 0) {
    items.push({
      description: `${pkg?.name || 'Paket Wisata'} - Bayi`,
      quantity: booking.infant_pax,
      unitPrice: infantPrice,
      total: infantPrice * booking.infant_pax,
    });
  }

  // If no items calculated, use total as single line item
  if (items.length === 0) {
    items.push({
      description: pkg?.name || 'Paket Wisata',
      quantity: 1,
      unitPrice: Number(booking.total_amount),
      total: Number(booking.total_amount),
    });
  }

  // Calculate subtotal
  const subtotal = Number(booking.subtotal) || items.reduce((sum, item) => sum + item.total, 0);

  // Build invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${booking.booking_code}`,
    invoiceDate: new Date(booking.created_at || Date.now()).toLocaleDateString('id-ID', {
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
    total: Number(booking.total_amount),
    paymentStatus: booking.status === 'paid' || booking.status === 'confirmed' ? 'paid' : 'pending',
    paymentMethod: booking.status === 'paid' || booking.status === 'confirmed' ? 'Transfer/Online Payment' : undefined,
    notes: booking.special_requests || undefined,
  };

  try {
    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(InvoicePDF({ data: invoiceData }));
    
    // Convert buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF response
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.booking_code}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (pdfError) {
    logger.error('Failed to generate invoice PDF', pdfError);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
});
